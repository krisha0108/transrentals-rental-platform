'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StoryDesignEditor from '../_components/StoryDesignEditor';
import { Loader2 } from 'lucide-react';

export default function EditStoryPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const res = await fetch(`/api/admin/web-stories/${id}`);
        if (!res.ok) throw new Error('Story not found');
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message || 'Failed to load story');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStory();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
      <div className="text-center">
        <p className="text-red-400 font-medium">{error || 'Story not found'}</p>
        <a href="/admin/web-stories" className="text-indigo-400 text-sm hover:underline mt-2 inline-block">Back to Stories</a>
      </div>
    </div>
  );

  return <StoryDesignEditor mode="edit" initialData={data} />;
}
