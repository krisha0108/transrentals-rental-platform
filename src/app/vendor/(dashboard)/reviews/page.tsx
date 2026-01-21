'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Calendar,
  User,
  Car,
  Filter,
  TrendingUp,
  Award,
  AlertCircle,
} from 'lucide-react';

interface Review {
  id: string;
  customerName: string;
  customerAvatar?: string;
  bookingNumber: string;
  vehicleName: string;
  rating: number;
  comment: string;
  date: string;
  reply?: string;
  repliedAt?: string;
  helpful: number;
  verified: boolean;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
  responseRate: number;
}

export default function VendorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    // Simulated data
    await new Promise(resolve => setTimeout(resolve, 500));

    setStats({
      averageRating: 4.7,
      totalReviews: 156,
      fiveStars: 98,
      fourStars: 42,
      threeStars: 12,
      twoStars: 3,
      oneStar: 1,
      responseRate: 92,
    });

    setReviews([
      {
        id: '1',
        customerName: 'Rahul Sharma',
        bookingNumber: 'TR2024120001',
        vehicleName: 'Toyota Fortuner',
        rating: 5,
        comment: 'Excellent service! The car was in perfect condition and the pickup was seamless. Driver was very professional and punctual. Highly recommended!',
        date: '2024-12-10',
        helpful: 12,
        verified: true,
        reply: 'Thank you for your kind words, Rahul! We are glad you had a great experience. Looking forward to serving you again!',
        repliedAt: '2024-12-11',
      },
      {
        id: '2',
        customerName: 'Priya Patel',
        bookingNumber: 'TR2024120002',
        vehicleName: 'Honda City',
        rating: 4,
        comment: 'Good experience overall. Car was clean and well-maintained. Minor delay in pickup but customer support handled it well.',
        date: '2024-12-09',
        helpful: 8,
        verified: true,
      },
      {
        id: '3',
        customerName: 'Amit Kumar',
        bookingNumber: 'TR2024110045',
        vehicleName: 'Maruti Swift',
        rating: 5,
        comment: 'Best self-drive experience! The car was exactly as described. Will definitely book again for my next trip.',
        date: '2024-12-05',
        helpful: 15,
        verified: true,
        reply: 'Thank you Amit! We appreciate your trust in our services. Safe travels!',
        repliedAt: '2024-12-06',
      },
      {
        id: '4',
        customerName: 'Sneha Reddy',
        bookingNumber: 'TR2024110032',
        vehicleName: 'Mercedes E-Class',
        rating: 5,
        comment: 'Premium service with premium car. The chauffeur was extremely professional. Made our event very special. Thank you TransRentals!',
        date: '2024-11-28',
        helpful: 20,
        verified: true,
      },
      {
        id: '5',
        customerName: 'Vikram Singh',
        bookingNumber: 'TR2024110025',
        vehicleName: 'Hyundai Creta',
        rating: 3,
        comment: 'Car was okay but AC was not cooling properly. Hope it gets fixed for future customers.',
        date: '2024-11-20',
        helpful: 5,
        verified: true,
        reply: 'We apologize for the inconvenience, Vikram. We have addressed the AC issue immediately. Thank you for your feedback.',
        repliedAt: '2024-11-21',
      },
    ]);

    setLoading(false);
  };

  const handleSubmitReply = async (reviewId: string) => {
    if (!replyText.trim()) return;

    // In production, this would call an API
    setReviews(reviews.map(r =>
      r.id === reviewId
        ? { ...r, reply: replyText, repliedAt: new Date().toISOString() }
        : r
    ));
    setReplyingTo(null);
    setReplyText('');
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    if (filter === 'positive') return review.rating >= 4;
    if (filter === 'negative') return review.rating < 4;
    if (filter === 'unanswered') return !review.reply;
    return true;
  });

  const getRatingDistribution = (stars: number) => {
    if (!stats) return 0;
    const counts: Record<number, number> = {
      5: stats.fiveStars,
      4: stats.fourStars,
      3: stats.threeStars,
      2: stats.twoStars,
      1: stats.oneStar,
    };
    return (counts[stars] / stats.totalReviews) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
        <p className="text-gray-600 mt-1">See what customers are saying about your service</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Rating Card */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-gray-900">{stats.averageRating}</p>
                <div className="flex items-center justify-center gap-1 my-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(stats.averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500">{stats.totalReviews} reviews</p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map(stars => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="w-3 text-sm text-gray-600">{stars}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${getRatingDistribution(stars)}%` }}
                      />
                    </div>
                    <span className="w-8 text-sm text-gray-500 text-right">
                      {Math.round(getRatingDistribution(stars))}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Response Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.responseRate}%</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              You respond to {stats.responseRate}% of reviews. Keep it up!
            </p>
          </div>

          {/* Achievement */}
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-yellow-100">Top Rated</p>
                <p className="text-2xl font-bold">Vendor</p>
              </div>
            </div>
            <p className="text-sm text-yellow-100">
              You're in the top 10% of vendors in your city!
            </p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Reviews' },
            { id: 'positive', label: 'Positive' },
            { id: 'negative', label: 'Needs Attention' },
            { id: 'unanswered', label: 'Unanswered' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No reviews found</h3>
            <p className="text-gray-500">No reviews match your current filter.</p>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {review.customerAvatar ? (
                    <img
                      src={review.customerAvatar}
                      alt={review.customerName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{review.customerName}</h4>
                      {review.verified && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Car className="w-4 h-4" />
                      <span>{review.vehicleName}</span>
                      <span>•</span>
                      <span>#{review.bookingNumber}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(review.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{review.comment}</p>

              {/* Reply Section */}
              {review.reply ? (
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">Your Response</span>
                    <span className="text-xs text-gray-500">
                      {new Date(review.repliedAt!).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{review.reply}</p>
                </div>
              ) : replyingTo === review.id ? (
                <div className="mt-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Write your response..."
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmitReply(review.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Submit Reply
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setReplyingTo(review.id)}
                  className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <MessageSquare className="w-4 h-4" />
                  Reply to this review
                </button>
              )}

              {/* Helpful */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{review.helpful} found helpful</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
