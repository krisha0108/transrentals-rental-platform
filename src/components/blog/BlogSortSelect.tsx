'use client';

export function BlogSortSelect({ defaultSort }: { defaultSort?: string }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-gray-600">
        Sort by:
      </label>
      <select
        id="sort"
        defaultValue={defaultSort || 'latest'}
        onChange={(e) => {
          const url = new URL(window.location.href);
          url.searchParams.set('sort', e.target.value);
          window.location.href = url.toString();
        }}
        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="latest">Latest</option>
        <option value="popular">Most Popular</option>
        <option value="oldest">Oldest</option>
      </select>
    </div>
  );
}
