import { redirect } from 'next/navigation';

interface SearchPageProps {
  searchParams: { q?: string };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const q = searchParams.q || '';
  redirect(`/blog/search${q ? `?q=${encodeURIComponent(q)}` : ''}`);
}
