'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import BlogPostEditor from '@/components/admin/blog/BlogPostEditor';
import { Loader2 } from 'lucide-react';

export default function EditGeneralBlogPostPage() {
  const params = useParams();
  const id = (params?.id as string) || '';

  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/blog/${id}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setInitialData(data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (notFound || !initialData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Post not found.</p>
      </div>
    );
  }

  return (
    <BlogPostEditor
      apiBase="/api/admin/blog"
      backHref="/admin/blog"
      backLabel="Back to Blog"
      initialData={initialData}
      postId={id}
    />
  );
}
