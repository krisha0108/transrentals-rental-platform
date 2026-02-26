'use client';

import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  User,
  Car,
  Calendar,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Flag,
  ChevronRight,
  Award,
  Smile,
  Meh,
  Frown,
  BarChart3
} from 'lucide-react';

interface Review {
  id: string;
  bookingId: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  vehicle: {
    name: string;
    number: string;
  };
  driver?: string;
  serviceType: string;
  tripDate: string;
  rating: number;
  driverRating?: number;
  vehicleRating?: number;
  punctualityRating?: number;
  review: string;
  aspects: {
    liked: string[];
    disliked: string[];
  };
  status: 'pending' | 'responded' | 'flagged';
  response?: string;
  responseDate?: string;
  createdAt: string;
}

// Mock reviews
const mockReviews: Review[] = [
  {
    id: 'R001',
    bookingId: 'BK-2024-0156',
    customer: { name: 'Rahul Sharma', phone: '+91 9737965551', email: 'rahul@email.com' },
    vehicle: { name: 'Toyota Innova', number: 'KA-01-AB-1234' },
    driver: 'Ramesh Kumar',
    serviceType: 'Airport Transfer',
    tripDate: '2024-01-18',
    rating: 5,
    driverRating: 5,
    vehicleRating: 5,
    punctualityRating: 5,
    review: 'Excellent service! Driver was very professional and arrived on time. Car was clean and comfortable. Will definitely book again.',
    aspects: {
      liked: ['Punctuality', 'Clean Vehicle', 'Professional Driver', 'Smooth Ride'],
      disliked: []
    },
    status: 'responded',
    response: 'Thank you for your wonderful feedback! We are glad you had a great experience.',
    responseDate: '2024-01-19',
    createdAt: '2024-01-18'
  },
  {
    id: 'R002',
    bookingId: 'BK-2024-0148',
    customer: { name: 'Priya Menon', phone: '+91 9737965551', email: 'priya@email.com' },
    vehicle: { name: 'Honda City', number: 'KA-01-EF-9012' },
    driver: 'Prakash Raj',
    serviceType: 'Outstation Trip',
    tripDate: '2024-01-15',
    rating: 4,
    driverRating: 5,
    vehicleRating: 4,
    punctualityRating: 4,
    review: 'Good service overall. Driver was excellent but there was a slight delay in pickup. Car was comfortable.',
    aspects: {
      liked: ['Courteous Driver', 'Comfortable Ride', 'Safe Driving'],
      disliked: ['Slight Delay']
    },
    status: 'pending',
    createdAt: '2024-01-16'
  },
  {
    id: 'R003',
    bookingId: 'BK-2024-0132',
    customer: { name: 'Amit Patel', phone: '+91 97379 65551', email: 'amit@email.com' },
    vehicle: { name: 'Maruti Swift', number: 'KA-01-CD-5678' },
    serviceType: 'Self-Drive',
    tripDate: '2024-01-12',
    rating: 3,
    vehicleRating: 3,
    punctualityRating: 4,
    review: 'Vehicle condition could be better. Found some scratches on the car. Pickup process was smooth though.',
    aspects: {
      liked: ['Easy Pickup', 'Good Location'],
      disliked: ['Vehicle Condition', 'Scratches on Car']
    },
    status: 'flagged',
    createdAt: '2024-01-13'
  },
  {
    id: 'R004',
    bookingId: 'BK-2024-0128',
    customer: { name: 'Sneha Reddy', phone: '+91 97379 65551', email: 'sneha@email.com' },
    vehicle: { name: 'Toyota Fortuner', number: 'KA-01-IJ-7890' },
    driver: 'Vijay Shetty',
    serviceType: 'Wedding Car',
    tripDate: '2024-01-10',
    rating: 5,
    driverRating: 5,
    vehicleRating: 5,
    punctualityRating: 5,
    review: 'Made our wedding day special! The car was beautifully decorated and driver was extremely professional. Highly recommended!',
    aspects: {
      liked: ['Beautiful Decoration', 'Professional Service', 'Premium Vehicle', 'Perfect Timing'],
      disliked: []
    },
    status: 'responded',
    response: 'Thank you so much! Wishing you both a lifetime of happiness!',
    responseDate: '2024-01-11',
    createdAt: '2024-01-10'
  }
];

const getSentimentIcon = (rating: number) => {
  if (rating >= 4) return Smile;
  if (rating >= 3) return Meh;
  return Frown;
};

const getSentimentColor = (rating: number) => {
  if (rating >= 4) return 'text-green-600';
  if (rating >= 3) return 'text-yellow-600';
  return 'text-red-600';
};

export default function FeedbackPage() {
  const [reviews] = useState<Review[]>(mockReviews);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showResponseModal, setShowResponseModal] = useState<Review | null>(null);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.bookingId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === 'all' || review.rating === parseInt(ratingFilter);
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    return matchesSearch && matchesRating && matchesStatus;
  });

  // Stats
  const stats = {
    total: reviews.length,
    avgRating: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
    fiveStar: reviews.filter(r => r.rating === 5).length,
    fourStar: reviews.filter(r => r.rating === 4).length,
    pending: reviews.filter(r => r.status === 'pending').length,
    nps: Math.round(((reviews.filter(r => r.rating >= 4).length - reviews.filter(r => r.rating <= 2).length) / reviews.length) * 100)
  };

  const renderStars = (rating: number, size: string = 'w-4 h-4') => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${size} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Feedback</h1>
          <p className="text-gray-600 mt-1">View and respond to customer reviews</p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Send className="w-4 h-4" />
            Request Feedback
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            <span className="text-3xl font-bold text-gray-900">{stats.avgRating}</span>
          </div>
          <p className="text-sm text-gray-500">Avg Rating</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Reviews</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.fiveStar}</p>
          <p className="text-sm text-gray-500">5-Star</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.fourStar}</p>
          <p className="text-sm text-gray-500">4-Star</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">Pending Reply</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className={`text-3xl font-bold ${stats.nps >= 50 ? 'text-green-600' : stats.nps >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
            {stats.nps}
          </p>
          <p className="text-sm text-gray-500">NPS Score</p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const percentage = (count / reviews.length) * 100;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-6">{star}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${star >= 4 ? 'bg-green-500' : star === 3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12">{count} ({percentage.toFixed(0)}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by customer or booking..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Reply</option>
            <option value="responded">Responded</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredReviews.map(review => {
            const SentimentIcon = getSentimentIcon(review.rating);
            return (
              <div
                key={review.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${review.status === 'flagged' ? 'bg-red-50' : ''}`}
                onClick={() => setSelectedReview(review)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${review.rating >= 4 ? 'bg-green-100' : review.rating >= 3 ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                      <SentimentIcon className={`w-6 h-6 ${getSentimentColor(review.rating)}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">{review.customer.name}</h3>
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">{review.rating}/5</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{review.bookingId}</span>
                        <span>•</span>
                        <span>{review.serviceType}</span>
                        <span>•</span>
                        <span>{new Date(review.tripDate).toLocaleDateString('en-IN')}</span>
                      </div>
                      <p className="text-gray-600 mt-2 line-clamp-2">{review.review}</p>

                      {/* Aspects */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {review.aspects.liked.slice(0, 3).map((aspect, i) => (
                          <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {aspect}
                          </span>
                        ))}
                        {review.aspects.disliked.slice(0, 2).map((aspect, i) => (
                          <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" />
                            {aspect}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${review.status === 'responded' ? 'bg-green-100 text-green-700' :
                      review.status === 'flagged' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {review.status === 'responded' ? 'Replied' : review.status === 'flagged' ? 'Flagged' : 'Pending'}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${selectedReview.rating >= 4 ? 'bg-green-100' : selectedReview.rating >= 3 ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                    {React.createElement(getSentimentIcon(selectedReview.rating), {
                      className: `w-7 h-7 ${getSentimentColor(selectedReview.rating)}`
                    })}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedReview.customer.name}</h2>
                    <p className="text-gray-500">{selectedReview.bookingId}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedReview(null)} className="p-2 hover:bg-gray-100 rounded-lg">×</button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Ratings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Overall</p>
                  <div className="flex justify-center mt-1">{renderStars(selectedReview.rating, 'w-5 h-5')}</div>
                </div>
                {selectedReview.driverRating && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Driver</p>
                    <div className="flex justify-center mt-1">{renderStars(selectedReview.driverRating, 'w-5 h-5')}</div>
                  </div>
                )}
                {selectedReview.vehicleRating && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Vehicle</p>
                    <div className="flex justify-center mt-1">{renderStars(selectedReview.vehicleRating, 'w-5 h-5')}</div>
                  </div>
                )}
                {selectedReview.punctualityRating && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Punctuality</p>
                    <div className="flex justify-center mt-1">{renderStars(selectedReview.punctualityRating, 'w-5 h-5')}</div>
                  </div>
                )}
              </div>

              {/* Review Text */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">&ldquo;{selectedReview.review}&rdquo;</p>
              </div>

              {/* Aspects */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">What they liked</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedReview.aspects.liked.map((aspect, i) => (
                      <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {aspect}
                      </span>
                    ))}
                    {selectedReview.aspects.liked.length === 0 && <span className="text-sm text-gray-400">None mentioned</span>}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">What could improve</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedReview.aspects.disliked.map((aspect, i) => (
                      <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded-full flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3" />
                        {aspect}
                      </span>
                    ))}
                    {selectedReview.aspects.disliked.length === 0 && <span className="text-sm text-gray-400">None mentioned</span>}
                  </div>
                </div>
              </div>

              {/* Response */}
              {selectedReview.response && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-700 mb-1">Your Response</p>
                  <p className="text-gray-700">{selectedReview.response}</p>
                  <p className="text-xs text-gray-500 mt-2">Responded on {new Date(selectedReview.responseDate!).toLocaleDateString('en-IN')}</p>
                </div>
              )}

              {/* Actions */}
              {selectedReview.status === 'pending' && (
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Flag className="w-4 h-4" />
                    Flag Review
                  </button>
                  <button
                    onClick={() => {
                      setShowResponseModal(selectedReview);
                      setSelectedReview(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Write Response
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Respond to Review</h2>
              <p className="text-gray-500">{showResponseModal.customer.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">&ldquo;{showResponseModal.review}&rdquo;</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Response</label>
                <textarea
                  rows={4}
                  placeholder="Thank you for your feedback..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResponseModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Submit Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
