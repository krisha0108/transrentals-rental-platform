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
        <h4 className="mb-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-gray-400">Vehicle Images</h4>

        <div className="relative">
          {/* Prev Button */}
          {canScrollPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 z-10 grid h-9 w-9 -translate-x-3.5 -translate-y-1/2 place-items-center rounded-full border border-gray-100 bg-white text-gray-500 shadow-[0_6px_18px_-6px_rgba(15,26,21,.35)] transition hover:border-[#96E4C2] hover:text-[#056B3E]"
              aria-label="Previous"
            >
              <ChevronLeft className="w-[18px] h-[18px]" />
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
                  className="group relative aspect-square overflow-hidden rounded-xl border border-gray-100 bg-[#F4F8F6] transition hover:-translate-y-0.5 hover:border-[#96E4C2] hover:shadow-[0_12px_26px_-12px_rgba(9,179,104,.45)]"
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
                    className="pointer-events-none object-cover transition duration-300 group-hover:scale-[1.04]"
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
              className="absolute right-0 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 translate-x-3.5 place-items-center rounded-full border border-gray-100 bg-white text-gray-500 shadow-[0_6px_18px_-6px_rgba(15,26,21,.35)] transition hover:border-[#96E4C2] hover:text-[#056B3E]"
              aria-label="Next"
            >
              <ChevronRight className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>

        {/* Image Counter */}
        <p className="mt-2.5 text-center text-[11.5px] text-gray-400">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsToShow, images.length)} of {images.length} images
        </p>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(1,20,11,.94)] backdrop-blur-[2px]"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : images.length - 1);
            }}
            className="absolute left-4 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
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
            className="absolute right-4 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12.5px] font-semibold tabular-nums text-white backdrop-blur-sm">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
