'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { searchBlogPosts } from '@/lib/api/blog';
import { BlogPost } from '@/types/blog';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { BlogSearch } from '@/components/blog/BlogSearch';
import { Search, ArrowLeft } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setPosts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const results = await searchBlogPosts(query, 50);
        setPosts(results);
      } catch (error) {
        console.error('Search error:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
        <div className="container mx-auto px-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Reflections
          </Link>
          <div className="flex items-center gap-3 mb-6">
            <Search size={40} />
            <h1 className="text-4xl md:text-5xl font-bold">Search Results</h1>
          </div>
          {query && (
            <p className="text-xl text-white/90 mb-6">
              {loading ? 'Searching for' : 'Results for'} "{query}"
            </p>
          )}
          <div className="max-w-2xl">
            <BlogSearch />
          </div>
        </div>
      </section>

      {/* Search Results */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Searching...</p>
          </div>
        ) : !query ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Enter a search query
            </h2>
            <p className="text-gray-600">
              Search for travel guides, tips, destinations, and more.
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No results found
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't find any posts matching "{query}". Try different keywords.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse All Posts
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Found {posts.length} {posts.length === 1 ? 'result' : 'results'} for "{query}"
              </h2>
            </div>
            <BlogGrid posts={posts} />
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <Search size={40} />
              <h1 className="text-4xl md:text-5xl font-bold">Search Results</h1>
            </div>
          </div>
        </section>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
