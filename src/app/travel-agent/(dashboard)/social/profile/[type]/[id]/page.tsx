'use client';

// Cross-type network profile viewer for travel agents. Renders either a vendor
// or another travel agent depending on the [type] segment, and exposes a
// "Message" button that opens (or creates) a conversation via the shared
// /api/social/chat/conversations endpoint.

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { PostImageSlideshow } from '@/components/social/PostImageSlideshow';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, MessageSquare, Loader2, Building2, Zap, Sparkles,
  BadgeCheck, Heart, MessageCircle,
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
  images?: string[];
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 pb-16">
      <div className="w-full px-4 sm:px-6">
        {/* Back */}
        <div className="pt-5">
          <button onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-emerald-700 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        {/* Two-column: profile (left) + posts (right) */}
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">

          {/* ===== LEFT — Profile (sticky) ===== */}
          <aside className="lg:sticky lg:top-6">
            <div className="relative rounded-3xl overflow-hidden bg-white shadow-[0_10px_40px_rgba(16,185,129,0.12)] border border-emerald-100/60">
              {/* Cover */}
              <div className="h-24 sm:h-28 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.15]"
                  style={{ backgroundImage: 'radial-gradient(white 1.2px, transparent 1.2px)', backgroundSize: '22px 22px' }} />
                <div className="absolute -right-16 -top-20 w-64 h-64 bg-white/15 rounded-full blur-3xl" />
                <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-cyan-300/20 rounded-full blur-3xl" />
              </div>

              {/* Identity (centered) */}
              <div className="px-5 pb-6 -mt-12 relative text-center">
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar name={profile.displayName} logo={profile.logo} size={92} />
                    <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                  <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{profile.displayName}</h1>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${typeBadge.cls}`}>
                    <BadgeCheck className="h-3 w-3" /> {typeBadge.label}
                  </span>
                </div>

                {profile.ownerName && (
                  <p className="text-sm text-gray-500 mt-1 font-medium">{profile.ownerName}</p>
                )}

                {(profile.city || profile.state) && (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    <MapPin className="h-3 w-3 text-emerald-500" />
                    {[profile.city, profile.state].filter(Boolean).join(', ')}
                  </p>
                )}

                {profile.description && (
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-4">{profile.description}</p>
                )}

                {/* Stat bar */}
                <div className="mt-4 flex items-stretch rounded-2xl bg-gray-50/80 border border-gray-100 divide-x divide-gray-200 overflow-hidden">
                  <div className="flex-1 px-3 py-2.5 text-center">
                    <p className="text-lg font-extrabold text-gray-900 leading-none">{profile.postsCount}</p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">Posts</p>
                  </div>
                  <div className="flex-1 px-3 py-2.5 text-center">
                    <p className="text-xs font-extrabold text-gray-900 leading-none mt-0.5">
                      {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">Joined</p>
                  </div>
                  <div className="flex-1 px-3 py-2.5 text-center">
                    <p className="text-xs font-extrabold text-emerald-700 leading-none mt-0.5">{typeBadge.label}</p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">Type</p>
                  </div>
                </div>

                {/* Action */}
                <div className="mt-4">
                  {!profile.isMe ? (
                    <button onClick={handleMessage} disabled={msgLoading}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-200 hover:shadow-xl disabled:opacity-60 transition-all">
                      {msgLoading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <MessageSquare className="h-4 w-4" />}
                      {msgLoading ? 'Opening...' : 'Message'}
                    </button>
                  ) : (
                    <span className="block text-center text-xs text-gray-400 italic bg-gray-50 rounded-xl px-5 py-2.5 border border-gray-100">
                      This is your own profile
                    </span>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* ===== RIGHT — Posts ===== */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-1.5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
              <h2 className="text-base font-extrabold text-gray-900">Recent Posts</h2>
              {posts.length > 0 && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  {posts.length}
                </span>
              )}
            </div>

            {posts.length === 0 ? (
              <div className="py-20 px-6 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-emerald-300" />
                </div>
                <p className="text-base font-bold text-gray-700">No posts yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  {profile.isMe ? "You haven't posted anything yet." : `${profile.displayName} hasn't posted anything yet.`}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
                {posts.map(p => (
                  <div key={p.id}
                    className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_40px_rgba(16,185,129,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        p.category.isSOS ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.category.isSOS && <Zap className="h-2.5 w-2.5" />}
                        {p.category.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">{timeAgo(p.createdAt)}</span>
                    </div>
                    <p className="text-[13.5px] text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-4">{p.content}</p>
                    <PostImageSlideshow images={p.images} />
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-5 text-[11px] font-semibold text-gray-500">
                      <span className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4 text-rose-400" /> {p.likesCount}</span>
                      <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4 text-emerald-500" /> {p.commentsCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
