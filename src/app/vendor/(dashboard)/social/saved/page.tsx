'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Saved posts are shown as a tab in the main social feed
export default function SavedPostsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/vendor/social?tab=saved'); }, []);
  return null;
}
