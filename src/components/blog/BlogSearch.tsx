'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
type ExtraParams = Record<string, string | undefined>;
interface BlogSearchProps {
  defaultValue?: string;
  destination?: string;
  queryParamName?: string;
  extraParams?: ExtraParams;
  placeholder?: string;
}
 export function BlogSearch({
  defaultValue = '',
  destination = '/blog/search',
  queryParamName = 'q',
  extraParams = {},
  placeholder = 'Search blog posts...',
}: BlogSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();
  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }
    const params = new URLSearchParams();
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    params.set(queryParamName, trimmedQuery);
    const separator = destination.includes('?') ? '&' : '?';
    router.push(`${destination}${separator}${params.toString()}`);
  };
  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        size={20}
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
