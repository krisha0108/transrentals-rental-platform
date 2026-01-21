import React from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const blogPosts = [
  {
    title: '10 Must-Visit Weekend Getaways from Bangalore on a Rental Bike',
    excerpt:
      'Discover the best weekend destinations near Bangalore perfect for bike trips. From hill stations to coastal routes.',
    category: 'Travel Guides',
    date: '15 Dec 2024',
    slug: '10-weekend-getaways-from-bangalore',
    image: '/images/blog/bangalore-trips.jpg',
  },
  {
    title: 'Manali to Leh Bike Trip: A Complete Guide',
    excerpt:
      'Everything you need to know about the epic Manali-Leh highway bike journey including best time, routes, and tips.',
    category: 'Adventure',
    date: '10 Dec 2024',
    slug: 'manali-to-leh-bike-trip',
    image: '/images/blog/manali-leh.jpg',
  },
  {
    title: 'How to Choose the Best Bike for Your Trip',
    excerpt:
      'A comprehensive guide to selecting the right bike for your journey based on terrain, distance, and experience.',
    category: 'Tips & Tricks',
    date: '5 Dec 2024',
    slug: 'choose-best-bike-for-trip',
    image: '/images/blog/bike-selection.jpg',
  },
];

export function BlogSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Travel Guides & Tips
            </h2>
            <p className="text-lg text-gray-600">
              Get inspired and plan your next adventure with our travel guides
            </p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex">
            <Link href="/blog">
              View All Posts
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <Link
              key={index}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                {/* Placeholder gradient */}
                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 group-hover:scale-110 transition-transform duration-300" />

                {/* Category Badge */}
                <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-xs font-medium text-primary">
                  {post.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>{post.date}</span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>

                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {post.excerpt}
                </p>

                <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                  <span>Read More</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="text-center mt-8 md:hidden">
          <Button variant="outline" asChild>
            <Link href="/blog">
              View All Posts
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
