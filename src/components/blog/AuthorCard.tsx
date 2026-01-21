import Link from 'next/link';
import Image from 'next/image';
import { Author } from '@/types/blog';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/utils';

interface AuthorCardProps {
  author: Author;
  showBio?: boolean;
}

 export function AuthorCard({ author, showBio = true }: AuthorCardProps) {
  const avatarUrl = resolveAssetUrl(author.avatar);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
      <div className="flex items-start gap-4">
        <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-4 border-white shadow-lg">
          <Image
            src={avatarUrl}
            alt={author.name}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <Link href={`/blog/author/${author.slug}`}>
            <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              {author.name}
            </h3>
          </Link>
          {author.role && (
            <p className="text-sm text-gray-600 mb-2">{author.role}</p>
          )}
          {showBio && author.bio && (
            <p className="text-sm text-gray-700 mb-3">{author.bio}</p>
          )}
          {author.socialLinks && (
            <div className="flex gap-3">
              {author.socialLinks.twitter && (
                <a
                  href={author.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-500 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter size={18} />
                </a>
              )}
              {author.socialLinks.linkedin && (
                <a
                  href={author.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-700 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={18} />
                </a>
              )}
              {author.socialLinks.instagram && (
                <a
                  href={author.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-pink-600 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
              )}
              {author.socialLinks.facebook && (
                <a
                  href={author.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook size={18} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
