'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/contexts/LocationContext';
import { getPostsByCity } from '@/data/blog-posts';
import { format } from 'date-fns';


export function BlogSectionDynamic() {
  const { currentCity } = useLocation();
  const cityPosts = getPostsByCity(currentCity.slug, 3);

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Travel Guides & Tips for {currentCity.name}
            </h2>
            <p className="text-lg text-gray-600">
              Discover the best travel content and rental tips for {currentCity.name} and nearby destinations
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
          {cityPosts.map((post) => {
            const categoryColor = post.category.color || '#3B82F6';
            const categoryIcon = post.category.icon || '📝';

            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Solid Color Background with Category Icon */}
                <div className="relative h-48 overflow-hidden">
                  <div
                    className="w-full h-full group-hover:scale-110 transition-transform duration-300 flex items-center justify-center"
                    style={{ backgroundColor: categoryColor }}
                  >
                    <span className="text-8xl opacity-20">{categoryIcon}</span>
                  </div>

                  {/* Category Badge */}
                  <div
                    className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5"
                    style={{
                      backgroundColor: `${post.category.color}20`,
                      color: post.category.color,
                      border: `1px solid ${post.category.color}40`
                    }}
                  >
                    <span>{categoryIcon}</span>
                    <span>{post.category.name}</span>
                  </div>

                  {/* Read Time Badge */}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{post.readTime} min</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(post.publishedAt), 'dd MMM yyyy')}</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {post.author.avatar && (
                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${post.author.avatar})` }}
                          />
                        </div>
                      )}
                      <span className="text-xs text-gray-500">{post.author.name}</span>
                    </div>

                    <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                      <span>Read More</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
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
