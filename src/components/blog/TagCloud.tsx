import Link from 'next/link';
import { Tag } from '@/types/blog';
import { Tags } from 'lucide-react';

interface TagCloudProps {
  tags: Tag[];
  currentTag?: string;
}

export function TagCloud({ tags, currentTag }: TagCloudProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Tags size={24} />
        Popular Tags
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isActive = currentTag === tag.slug;
          return (
            <Link
              key={tag.id}
              href={`/blog/tag/${tag.slug}`}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              #{tag.name}
              <span className="text-xs opacity-75">({tag.postCount})</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
