'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface VehicleImageGalleryProps {
  vehicleImages: string | string[] | null | undefined;
  vehicleName: string;
}

export default function VehicleImageGallery({ vehicleImages, vehicleName }: VehicleImageGalleryProps) {
  const [startIndex, setStartIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsToShow = 3;

  // Parse vehicle images
  const images = React.useMemo(() => {
    if (!vehicleImages) return [];

    // If already an array, return as is
    if (Array.isArray(vehicleImages)) {
      return vehicleImages;
    }

    // If string, try to parse JSON
    if (typeof vehicleImages === 'string') {
      try {
        const parsed = JSON.parse(vehicleImages);

        // If parsed is an array, return it
        if (Array.isArray(parsed)) {
          return parsed;
        }

        // If parsed is an object (e.g., {front: "url", side: "url"}), extract values
        if (typeof parsed === 'object' && parsed !== null) {
          return Object.values(parsed).filter((url): url is string =>
            typeof url === 'string' && url.length > 0
          );
        }

        return [];
      } catch {
        return [];
      }
    }

    return [];
  }, [vehicleImages]);

  // Don't render if no images
  if (images.length === 0) return null;

  const canScrollPrev = startIndex > 0;
  const canScrollNext = startIndex < images.length - itemsToShow;

  const handlePrev = () => {
    if (canScrollPrev) {
      setStartIndex(startIndex - 1);
    }
  };

  const handleNext = () => {
    if (canScrollNext) {
      setStartIndex(startIndex + 1);
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (containerRef.current?.offsetLeft || 0));
    setScrollLeft(containerRef.current?.scrollLeft || 0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (containerRef.current?.offsetLeft || 0));
    setScrollLeft(containerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (containerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (containerRef.current) {
      containerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (containerRef.current) {
      containerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Snap to nearest item based on scroll position
    if (containerRef.current) {
      const scrolled = containerRef.current.scrollLeft;
      const itemWidth = containerRef.current.scrollWidth / images.length;
      const newIndex = Math.round(scrolled / itemWidth);
      setStartIndex(Math.max(0, Math.min(newIndex, images.length - itemsToShow)));
    }
  };

  const visibleImages = images.slice(startIndex, startIndex + itemsToShow);

  return (
    <>
      {/* Image Slider */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Vehicle Images</h4>

        <div className="relative">
          {/* Prev Button */}
          {canScrollPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {/* Images Container */}
          <div
            ref={containerRef}
            className="grid grid-cols-3 gap-3 cursor-grab active:cursor-grabbing select-none overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleDragEnd}
          >
            {visibleImages.map((imageUrl, idx) => {
              const actualIndex = startIndex + idx;
              return (
                <div
                  key={actualIndex}
                  className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition bg-gray-100 border border-gray-200"
                  onClick={(e) => {
                    // Only open lightbox if not dragging
                    if (!isDragging) {
                      setLightboxIndex(actualIndex);
                    }
                  }}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <Image
                    src={imageUrl}
                    alt={`${vehicleName} - Image ${actualIndex + 1}`}
                    fill
                    className="object-cover pointer-events-none"
                    sizes="(max-width: 768px) 33vw, 250px"
                    draggable={false}
                  />
                </div>
              );
            })}
          </div>

          {/* Next Button */}
          {canScrollNext && (
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>

        {/* Image Counter */}
        <p className="text-xs text-gray-500 text-center mt-2">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsToShow, images.length)} of {images.length} images
        </p>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : images.length - 1);
            }}
            className="absolute left-4 text-white hover:text-gray-300 transition z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-12 h-12" />
          </button>

          {/* Image */}
          <div
            className="relative max-w-5xl max-h-[90vh] w-full h-full mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex]}
              alt={`${vehicleName} - Image ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(lightboxIndex < images.length - 1 ? lightboxIndex + 1 : 0);
            }}
            className="absolute right-4 text-white hover:text-gray-300 transition z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-12 h-12" />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-full text-white text-sm">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
