'use client';

import { useEffect, useState } from 'react';

/**
 * Auto-rotating image slideshow for social post cards.
 * - 1 image  → shown static
 * - >1 image → fades to the next image every 2s, with dot indicators
 */
export function PostImageSlideshow({
  images,
  className = '',
}: {
  images?: string[];
  className?: string;
}) {
  const valid = (images || []).filter(Boolean).slice(0, 4);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (valid.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % valid.length);
    }, 2000);
    return () => clearInterval(t);
  }, [valid.length]);

  if (valid.length === 0) return null;

  return (
    <div
      className={`relative mt-3 w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50 h-36 sm:h-40 ${className}`}
    >
      {valid.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={img}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            i === idx ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {valid.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {valid.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
