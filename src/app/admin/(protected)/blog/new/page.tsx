'use client';

import BlogPostEditor from '@/components/admin/blog/BlogPostEditor';

export default function NewGeneralBlogPostPage() {
  return (
    <BlogPostEditor
      apiBase="/api/admin/blog"
      backHref="/admin/blog"
      backLabel="Back to Blog"
    />
  );
}
