import Image from 'next/image';
import { Author } from '@/types/blog';
import { Facebook, Instagram, Linkedin, Twitter, PenLine } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/utils';

const EXPERTISE_TAGS = [
  'Road Trips',
  'Vehicle Rentals',
  'Travel Planning',
  'Destination Guides',
  'Budget Travel',
];

interface AuthorCardProps {
  author: Author;
  showBio?: boolean;
}

export function AuthorCard({ author, showBio = true }: AuthorCardProps) {
  const avatarUrl = resolveAssetUrl(author.avatar);
  const hasSocial =
    author.socialLinks &&
    (author.socialLinks.twitter ||
      author.socialLinks.linkedin ||
      author.socialLinks.instagram ||
      author.socialLinks.facebook);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
      {/* Top gradient bar */}
      <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      <div className="p-6 sm:p-8">
        {/* Header label */}
        <div className="mb-5 flex items-center gap-2">
          <PenLine size={16} className="text-blue-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-500">
            About the Author
          </span>
        </div>

        {/* Avatar + Name row */}
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-white shadow-md ring-2 ring-blue-100 sm:h-24 sm:w-24">
              <Image
                src={avatarUrl}
                alt={author.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            {/* Online dot */}
            <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-400 shadow" />
          </div>

          {/* Name + role + social */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 leading-tight">
              {author.name}
            </h3>
            <p className="mt-0.5 text-sm font-medium text-blue-600">
              {author.role || 'Content Expert at TransRentals'}
            </p>

            {/* Social icons */}
            {hasSocial && (
              <div className="mt-3 flex items-center gap-2">
                {author.socialLinks?.twitter && (
                  <a
                    href={author.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-500 transition-colors hover:bg-sky-100"
                  >
                    <Twitter size={15} />
                  </a>
                )}
                {author.socialLinks?.linkedin && (
                  <a
                    href={author.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
                  >
                    <Linkedin size={15} />
                  </a>
                )}
                {author.socialLinks?.instagram && (
                  <a
                    href={author.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-50 text-pink-500 transition-colors hover:bg-pink-100"
                  >
                    <Instagram size={15} />
                  </a>
                )}
                {author.socialLinks?.facebook && (
                  <a
                    href={author.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <Facebook size={15} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {showBio && (
          <p className="mt-5 text-sm leading-relaxed text-gray-600">
            {author.bio ||
              `${author.name} is a travel and vehicle rental expert at TransRentals, India's leading vehicle rental marketplace. With hands-on expertise in road trips, destination planning, and rental services across India, ${author.name} creates practical guides to help travelers explore India with confidence.`}
          </p>
        )}

        {/* Expertise chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {EXPERTISE_TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer: team label */}
        <div className="mt-5 border-t border-gray-100 pt-4">
          <span className="text-xs text-gray-400">TransRentals Blog Team</span>
        </div>
      </div>
    </div>
  );
}
