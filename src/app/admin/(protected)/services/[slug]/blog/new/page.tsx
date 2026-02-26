'use client';

import { useParams } from 'next/navigation';
import BlogPostEditor from '@/components/admin/blog/BlogPostEditor';

export default function NewServiceBlogPostPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  return (
    <BlogPostEditor
      apiBase={`/api/admin/services/${slug}/blog`}
      backHref={`/admin/services/${slug}/blog`}
      backLabel="Back to Blog"
    />
  );
}
