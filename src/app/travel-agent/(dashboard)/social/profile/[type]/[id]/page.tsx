'use client';

// Cross-type network profile viewer for travel agents. Renders either a vendor
// or another travel agent depending on the [type] segment, and exposes a
// "Message" button that opens (or creates) a conversation via the shared
// /api/social/chat/conversations endpoint.

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, MessageSquare, Clock, Loader2, Building2, Zap, Sparkles,
} from 'lucide-react';

interface Profile {
  type: 'vendor' | 'agent';
  id: string;
  displayName: string;
  ownerName: string | null;
  logo?: string | null;
  city?: string | null;
  state?: string | null;
  description?: string | null;
  createdAt: string;
  postsCount: number;
  isMe: boolean;
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  category: { id: string; name: string; isSOS: boolean };
  likesCount: number;
  commentsCount: number;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function Avatar({ name, logo, size = 96 }: { name: string; logo?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  const palette = ['bg-emerald-500', 'bg-teal-500', 'bg-green-600', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500'];
  const color = palette[name.charCodeAt(0) % palette.length];
  if (logo && !err) {
    return (
      <img src={logo} alt={name} onError={() => setErr(true)}
        className="rounded-full object-cover flex-shrink-0 ring-4 ring-white shadow-lg"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className={`${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none ring-4 ring-white shadow-lg`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function NetworkProfilePage({
  params,
}: {
  params: Promise<{ type: string; id: string }> | { type: string; id: string };
}) {
  const { type, id } = 'then' in params ? use(params) : params;
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/social/profile/${type}/${id}`)
      .then(async r => {
        if (cancelled) return;
        if (r.status === 404) { setNotFound(true); setLoading(false); return; }
        if (!r.ok) { setLoading(false); return; }
        const d = await r.json();
        setProfile(d.profile);
        setPosts(d.posts || []);
        setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [type, id]);

  const handleMessage = async () => {
    if (!profile || msgLoading) return;
    setMsgLoading(true);
    const res = await fetch('/api/social/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otherType: profile.type, otherId: profile.id }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/travel-agent/social/messages/${data.conversationId}`);
      return;
    }
    setMsgLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <Building2 className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-700 font-semibold">Profile not found</p>
        <p className="text-sm text-gray-400 mt-1">This {type} may have been removed.</p>
        <Link href="/travel-agent/social" className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
          ← Back to Travel Network
        </Link>
      </div>
    );
  }

  const typeBadge = profile.type === 'agent'
    ? { label: 'Travel Agent', cls: 'bg-indigo-100 text-indigo-700' }
    : { label: 'Vendor', cls: 'bg-emerald-100 text-emerald-700' };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="px-4 sm:px-6 pt-4">
        <button onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      {/* Header card */}
      <div className="mt-3 mx-4 sm:mx-6 rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.05)] bg-white">
        <div className="h-24 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.18)_0%,transparent_55%)]" />
        </div>
        <div className="px-5 sm:px-7 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-5">
            <Avatar name={profile.displayName} logo={profile.logo} size={96} />
            <div className="mt-3 sm:mt-0 sm:mb-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{profile.displayName}</h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${typeBadge.cls}`}>
                  {typeBadge.label}
                </span>
              </div>
              {profile.ownerName && (
                <p className="text-sm text-gray-500 mt-0.5">{profile.ownerName}</p>
              )}
              {(profile.city || profile.state) && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[profile.city, profile.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          {profile.description && (
            <p className="mt-4 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.description}</p>
          )}

          {/* Stats */}
          <div className="mt-4 flex items-center gap-5 border-y border-gray-100 py-3">
            <div>
              <p className="text-lg font-bold text-gray-900">{profile.postsCount}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Posts</p>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
              <Clock className="h-3 w-3" /> Joined {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </div>
          </div>

          {/* Actions */}
          {!profile.isMe && (
            <div className="mt-4">
              <button onClick={handleMessage} disabled={msgLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-md shadow-emerald-200/50">
                {msgLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <MessageSquare className="h-4 w-4" />}
                {msgLoading ? 'Opening...' : 'Message'}
              </button>
            </div>
          )}
          {profile.isMe && (
            <div className="mt-4 text-xs text-gray-400 italic">This is your own profile.</div>
          )}
        </div>
      </div>

      {/* Recent posts */}
      <div className="mt-6 px-4 sm:px-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> Recent Posts
        </h2>
        {posts.length === 0 ? (
          <div className="mt-3 py-10 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm text-gray-400 font-medium">No posts yet</p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {posts.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    p.category.isSOS ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {p.category.isSOS && <Zap className="h-2.5 w-2.5 inline mr-0.5" />}
                    {p.category.name}
                  </span>
                  <span className="text-[10px] text-gray-400">{timeAgo(p.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-4">{p.content}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
                  <span>{p.likesCount} likes</span>
                  <span>{p.commentsCount} comments</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
