import Link from 'next/link';
import { Category } from '@/types/blog';
import { ChevronRight, FolderOpen } from 'lucide-react';

interface CategorySidebarProps {
  categories: Category[];
  currentCategory?: string;
}

export function CategorySidebar({
  categories,
  currentCategory,
}: CategorySidebarProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FolderOpen size={24} />
        Categories
      </h3>
      <nav className="space-y-2">
        {categories.map((category) => {
          const isActive = currentCategory === category.slug;
          return (
            <Link
              key={category.id}
              href={`/blog/category/${category.slug}`}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {category.postCount}
                </span>
                <ChevronRight size={16} />
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
