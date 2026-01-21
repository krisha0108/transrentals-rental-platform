import { Category } from '@/types/blog';

export const blogCategories: Category[] = [
  {
    id: '1',
    name: 'Travel Guides',
    slug: 'travel-guides',
    description: 'Comprehensive travel guides for destinations across India. Discover hidden gems, must-visit places, and insider tips for your next adventure.',
    postCount: 45,
    color: '#3B82F6',
    icon: '🗺️',
  },
  {
    id: '2',
    name: 'Rental Tips',
    slug: 'rental-tips',
    description: 'Expert advice on car and bike rentals. Learn how to choose the right vehicle, get the best deals, and avoid common rental mistakes.',
    postCount: 38,
    color: '#10B981',
    icon: '💡',
  },
  {
    id: '3',
    name: 'Destination Spotlights',
    slug: 'destination-spotlights',
    description: 'Deep dives into specific cities and regions. Detailed guides covering attractions, local cuisine, culture, and the best time to visit.',
    postCount: 52,
    color: '#F59E0B',
    icon: '📍',
  },
  {
    id: '4',
    name: 'Adventure Stories',
    slug: 'adventure-stories',
    description: 'Real travel experiences and adventure stories from across India. Get inspired by epic road trips, bike journeys, and unforgettable experiences.',
    postCount: 28,
    color: '#EF4444',
    icon: '⛰️',
  },
  {
    id: '5',
    name: 'Wedding & Events',
    slug: 'wedding-events',
    description: 'Complete guide to wedding car rentals, baraat vehicles, and event transportation. Make your special day even more memorable.',
    postCount: 22,
    color: '#EC4899',
    icon: '💒',
  },
  {
    id: '6',
    name: 'Corporate Travel',
    slug: 'corporate-travel',
    description: 'Business travel solutions, corporate car rental tips, and fleet management advice for companies and professionals.',
    postCount: 18,
    color: '#6366F1',
    icon: '💼',
  },
  {
    id: '7',
    name: 'Seasonal Guides',
    slug: 'seasonal-guides',
    description: 'Season-specific travel guides. Best destinations for monsoon, summer, and winter trips. Plan your journey according to the weather.',
    postCount: 25,
    color: '#8B5CF6',
    icon: '🌦️',
  },
  {
    id: '8',
    name: 'Bike Trips',
    slug: 'bike-trips',
    description: 'Ultimate bike trip guides covering routes, itineraries, packing tips, and safety advice for motorcycle adventures across India.',
    postCount: 35,
    color: '#14B8A6',
    icon: '🏍️',
  },
  {
    id: '9',
    name: 'Booking Guides',
    slug: 'booking-guides',
    description: 'Step-by-step booking guides for cars, bikes, and special vehicles so your next experience is smooth and hassle-free.',
    postCount: 17,
    color: '#F97316',
    icon: '📘',
  },
];

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return blogCategories.find((category) => category.slug === slug);
};

export const getCategoryById = (id: string): Category | undefined => {
  return blogCategories.find((category) => category.id === id);
};

export const popularCategories = blogCategories
  .sort((a, b) => b.postCount - a.postCount)
  .slice(0, 6);
