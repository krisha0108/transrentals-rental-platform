'use client';

import React, { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    name: 'Rahul Sharma',
    location: 'Goa',
    service: 'Bike Rental',
    rating: 5,
    comment:
      'Amazing experience! Rented a Royal Enfield for my Goa trip. The bike was in perfect condition and the vendor was very helpful. Highly recommended!',
    date: 'Dec 2024',
  },
  {
    name: 'Priya Patel',
    location: 'Manali',
    service: 'Car Rental',
    rating: 5,
    comment:
      'Best car rental service in Manali. Got a well-maintained SUV at a great price. The entire process was smooth and hassle-free.',
    date: 'Nov 2024',
  },
  {
    name: 'Amit Kumar',
    location: 'Bangalore',
    service: 'Bus Rental',
    rating: 5,
    comment:
      'Booked a 40-seater bus for our company outing. Excellent service, professional driver, and competitive pricing. Will use again!',
    date: 'Oct 2024',
  },
  {
    name: 'Sneha Reddy',
    location: 'Udaipur',
    service: 'Bike Rental',
    rating: 5,
    comment:
      'Loved the variety of bikes available. Rented a Himalayan for exploring Udaipur. The booking process was super easy through TransRentals.',
    date: 'Dec 2024',
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="section-padding bg-gray-900 text-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-300">
            Don't just take our word for it - hear from our happy customers
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12">
            {/* Quote Icon */}
            <Quote className="absolute top-6 right-6 w-16 h-16 text-primary/20" />

            {/* Stars */}
            <div className="flex gap-1 mb-6">
              {[...Array(currentTestimonial.rating)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            {/* Comment */}
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-8 italic">
              "{currentTestimonial.comment}"
            </p>

            {/* Author Info */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-white mb-1">
                  {currentTestimonial.name}
                </h4>
                <p className="text-gray-300 text-sm">
                  {currentTestimonial.service} in {currentTestimonial.location} • {currentTestimonial.date}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevTestimonial}
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextTestimonial}
                  className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Indicators */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-primary w-8'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
