'use client';

// Agent-side "My Profile" — visual parity with the vendor profile page.
// Pulls the current agent from /api/travel-agent/profile and their own posts
// from /api/social/posts?type=my, then renders the same hero card + stats
// row + tabs + post grid the vendor side uses (emerald theme + animations).
//
// Stats:
//   * Posts  → live from /api/social/posts?type=my
//   * Tours  → derived (best-effort) from the agent's tours endpoint
//   * Followers — cross-type follow is Phase 2; shown as 0 for now.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, FileText, Compass, Heart, MessageCircle,
  Bookmark, BookmarkCheck, Trash2, Settings, Zap, Loader2,
} from 'lucide-react';

interface Agent {
  id: string;
  agencyName: string;
  ownerName: string;
  logo: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  createdAt: string;
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  vendor: { id: string; businessName: string; ownerName: string; logo?: string; city?: string };
  category: { id: string; name: string; isSOS: boolean };
  likedByMe: boolean;
  savedByMe: boolean;
  likesCount: number;
  commentsCount: number;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AgentAvatar({ agent, size = 76 }: { agent: Agent; size?: number }) {
  const [err, setErr] = useState(false);
  const colors = ['bg-emerald-600', 'bg-teal-500', 'bg-emerald-700', 'bg-green-700', 'bg-teal-600', 'bg-emerald-500', 'bg-green-600'];
  const color = colors[agent.agencyName.charCodeAt(0) % colors.length];
  if (agent.logo && !err) {
    return (
      <img src={agent.logo} alt={agent.agencyName} onError={() => setErr(true)}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className={`${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>
      {agent.agencyName.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AgentSocialProfileMePage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [toursCount, setToursCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'tours'>('posts');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profileRes, postsRes, toursRes] = await Promise.all([
          fetch('/api/travel-agent/profile'),
          fetch('/api/social/posts?type=my'),
          fetch('/api/travel-agent/tours').catch(() => null),
        ]);

        if (cancelled) return;

        if (profileRes.ok) {
          const data = await profileRes.json();
          setAgent({
            id: data.id,
            agencyName: data.agencyName,
            ownerName: data.ownerName,
            logo: data.logo ?? null,
            city: data.city ?? null,
            state: data.state ?? null,
            description: data.description ?? null,
            createdAt: data.createdAt,
          });
        }

        if (postsRes.ok) {
          const data = await postsRes.json();
          setPosts(data.posts || []);
        }

        if (toursRes && toursRes.ok) {
          const data = await toursRes.json();
          const arr = data.tours ?? data.data ?? data ?? [];
          setToursCount(Array.isArray(arr) ? arr.length : 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLike = async (postId: string) => {
    const res = await fetch(`/api/social/posts/${postId}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: data.liked, likesCount: data.likesCount } : p));
    }
  };

  const handleSave = async (postId: string) => {
    const res = await fetch(`/api/social/posts/${postId}/save`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, savedByMe: data.saved } : p));
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    const res = await fetch(`/api/social/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) setPosts(prev => prev.filter(p => p.id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-20 sm:pb-6">
        <style jsx global>{`
          @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
          .skeleton-shimmer { background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        `}</style>
        <div className="w-full">
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-100">
            <div className="h-36 sm:h-44 skeleton-shimmer" />
            <div className="px-5 pb-5">
              <div className="flex items-end -mt-14 mb-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full skeleton-shimmer ring-4 ring-white" />
              </div>
              <div className="h-6 w-44 skeleton-shimmer rounded-lg mb-2" />
              <div className="h-3.5 w-28 skeleton-shimmer rounded-lg mb-2" />
              <div className="h-3.5 w-36 skeleton-shimmer rounded-lg mb-4" />
              <div className="flex gap-3 pt-4 border-t border-emerald-200/50">
                <div className="flex-1 h-16 skeleton-shimmer rounded-xl" />
                <div className="flex-1 h-16 skeleton-shimmer rounded-xl" />
                <div className="flex-1 h-16 skeleton-shimmer rounded-xl" />
              </div>
            </div>
          </div>
          <div className="h-12 skeleton-shimmer rounded-2xl mt-4 mb-4" />
          <div className="space-y-3">
            <div className="h-36 skeleton-shimmer rounded-2xl" />
            <div className="h-36 skeleton-shimmer rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-20 sm:pb-6 flex flex-col items-center justify-center gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-gray-700 font-semibold mb-1">Profile not found</p>
          <p className="text-[13px] text-gray-400 mb-4">Please log in again or check your account.</p>
          <Link href="/travel-agent/social" className="text-emerald-600 text-sm font-medium hover:underline">Back to feed</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-20 sm:pb-6">
      <style jsx global>{`
        @keyframes fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slide-in-left { from { opacity:0; transform:translateX(-16px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slide-in-right { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        @keyframes scale-in { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes bounce-in { 0% { opacity:0; transform:scale(0.3); } 50% { transform:scale(1.05); } 70% { transform:scale(0.9); } 100% { opacity:1; transform:scale(1); } }
        @keyframes float-slow { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        @keyframes float-rev { 0%,100% { transform:translateY(0); } 50% { transform:translateY(6px); } }
        @keyframes sparkle { 0%,100% { opacity:0.3; transform:scale(0.8); } 50% { opacity:0.8; transform:scale(1.2); } }
        @keyframes shimmer-sweep { 0% { transform:translateX(-100%); } 100% { transform:translateX(100%); } }
        @keyframes count-up { 0% { opacity:0; transform:translateY(8px); } 100% { opacity:1; transform:translateY(0); } }
        @keyframes heart-pop { 0% { transform:scale(1); } 50% { transform:scale(1.4); } 100% { transform:scale(1); } }
        @keyframes bubble-rise-1 { 0% { transform:translateY(0) scale(1); opacity:0.4; } 50% { opacity:0.7; } 100% { transform:translateY(-120px) scale(0.3); opacity:0; } }
        @keyframes bubble-rise-2 { 0% { transform:translateY(0) scale(1); opacity:0.3; } 50% { opacity:0.6; } 100% { transform:translateY(-100px) scale(0.2); opacity:0; } }
        @keyframes bubble-drift { 0% { transform:translateY(0) translateX(0); opacity:0.3; } 50% { transform:translateY(-60px) translateX(8px); opacity:0.5; } 100% { transform:translateY(-130px) translateX(5px); opacity:0; } }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
        .animate-slide-in-left { animation: slide-in-left 0.4s ease-out both; }
        .animate-slide-in-right { animation: slide-in-right 0.4s ease-out both; }
        .animate-scale-in { animation: scale-in 0.4s ease-out both; }
        .animate-bounce-in { animation: bounce-in 0.6s ease-out both; }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-rev { animation: float-rev 5s ease-in-out infinite; }
        .animate-count-up { animation: count-up 0.5s ease-out both; }
        .animate-heart-pop { animation: heart-pop 0.3s ease-out; }
      `}</style>

      <div className="w-full">
        {/* Hero — emerald, alive */}
        <div className="relative rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.07)] mb-5 animate-fade-up bg-emerald-600">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.6)_0%,_transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.3)_0%,_transparent_50%)]"></div>

          <div className="absolute top-4 right-10 w-20 h-20 rounded-full border border-white/10 animate-float-slow"></div>
          <div className="absolute top-1 right-6 w-12 h-12 rounded-full border border-white/10 animate-float-rev"></div>
          <div className="absolute -bottom-3 left-12 w-16 h-16 rounded-full border border-white/5 animate-float-rev"></div>

          <div className="absolute top-[15%] left-[55%] w-1 h-1 bg-white rounded-full" style={{ animation: 'sparkle 3s ease-in-out infinite' }}></div>
          <div className="absolute top-[40%] left-[80%] w-1 h-1 bg-white rounded-full" style={{ animation: 'sparkle 3s ease-in-out 1.5s infinite' }}></div>
          <div className="absolute top-[70%] left-[90%] w-1 h-1 bg-white rounded-full" style={{ animation: 'sparkle 3s ease-in-out 2.5s infinite' }}></div>

          <div className="absolute bottom-0 left-[20%] w-2 h-2 rounded-full bg-white/20" style={{ animation: 'bubble-rise-1 4s ease-in-out infinite' }}></div>
          <div className="absolute bottom-0 left-[50%] w-1.5 h-1.5 rounded-full bg-white/25" style={{ animation: 'bubble-rise-2 5s ease-in-out 1s infinite' }}></div>
          <div className="absolute bottom-0 left-[70%] w-2.5 h-2.5 rounded-full bg-white/15" style={{ animation: 'bubble-drift 6s ease-in-out 0.5s infinite' }}></div>

          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent" style={{ animation: 'shimmer-sweep 5s ease-in-out infinite' }}></div>
          </div>

          <div className="relative px-5 sm:px-6 pt-5 pb-5">
            <div className="flex items-center justify-between mb-5">
              <Link href="/travel-agent/social" className="group w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              </Link>
              <div className="flex items-center gap-2 animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
                <Link href="/travel-agent/profile" className="group px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[11px] font-semibold hover:bg-white/25 transition-all flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-500" /> Edit Profile
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex-shrink-0 animate-bounce-in" style={{ animationDelay: '0.15s' }}>
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-white/20 blur-md"></div>
                  <div className="relative ring-4 ring-white rounded-full shadow-xl">
                    <AgentAvatar agent={agent} size={76} />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white truncate tracking-tight drop-shadow-sm">{agent.agencyName}</h1>
                <p className="text-[13px] text-white/75 mt-0.5 font-medium">{agent.ownerName}</p>
                <p className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                  Travel Agent
                </p>
                {(agent.city || agent.state) && (
                  <p className="flex items-center gap-1.5 text-[12px] text-white/60 mt-1.5">
                    <MapPin className="h-3 w-3" />
                    {[agent.city, agent.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {agent.description && (
                  <p className="text-[12px] text-white/50 mt-1.5 leading-relaxed line-clamp-1">{agent.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center mt-5 pt-4 border-t border-white/15">
              {[
                { label: 'Followers', value: 0, delay: '0.3s' },
                { label: 'Posts', value: posts.length, delay: '0.4s' },
                { label: 'Tours', value: toursCount, delay: '0.5s' },
              ].map((stat, idx) => (
                <div key={stat.label} className="flex items-center">
                  {idx > 0 && <div className="w-px h-7 bg-white/20 mx-5 sm:mx-7"></div>}
                  <div className="animate-count-up" style={{ animationDelay: stat.delay }}>
                    <span className="text-xl font-extrabold text-white drop-shadow-sm">{stat.value}</span>
                    <span className="text-[11px] text-white/60 ml-1.5 font-medium">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex sm:hidden gap-2 mt-4">
              <Link href="/travel-agent/profile" className="flex-1 text-center rounded-lg px-4 py-2 text-[11px] font-bold bg-white/15 backdrop-blur-sm text-white border border-white/20 hover:bg-white/25 transition-all">
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-1.5 shadow-[0_1px_6px_rgba(0,0,0,0.05)] mb-5 animate-scale-in" style={{ animationDelay: '0.25s' }}>
          <div className="flex gap-1.5">
            {(['posts', 'tours'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold text-center transition-all duration-200 ${
                  activeTab === tab ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}>
                {tab === 'tours' ? `Tours (${toursCount})` : `Posts (${posts.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Posts */}
        {activeTab === 'posts' && (
          <div>
            {posts.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 shadow-sm animate-fade-up">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-gray-700 font-semibold mb-0.5">No posts yet</p>
                <p className="text-[13px] text-gray-400 mb-4">Share your first update with the travel community.</p>
                <Link href="/travel-agent/social/create" className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-semibold transition-all">
                  Create Post
                </Link>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                {posts.map((post, idx) => {
                  const isExpanded = expandedId === post.id;
                  const isSOS = post.category.isSOS;
                  const cardColors = ['from-blue-500 to-blue-600', 'from-purple-500 to-purple-600', 'from-emerald-500 to-emerald-600', 'from-amber-500 to-amber-600', 'from-cyan-500 to-cyan-600', 'from-indigo-500 to-indigo-600'];
                  const cIdx = post.category.name.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % cardColors.length;
                  const topColor = isSOS ? 'from-red-600 to-red-700' : cardColors[cIdx];
                  return (
                    <div key={post.id}
                      className="break-inside-avoid mb-5 group rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.13)] hover:-translate-y-1.5 transition-all duration-300 animate-fade-up border border-gray-100/50 hover:border-emerald-200/50"
                      style={{ animationDelay: `${0.06 * idx}s` }}>
                      <div className={`bg-gradient-to-r ${topColor} px-4 py-3 relative overflow-hidden`}>
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                        <div className="relative flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                            {isSOS ? <><Zap className="w-3 h-3" /> SOS</> : post.category.name}
                          </span>
                          <span className="text-white/70 text-[10px] font-medium">{timeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                      <div className="bg-white p-4">
                        <p className={`text-[14px] leading-[1.7] text-gray-700 whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3' : ''}`}>{post.content}</p>
                        {post.content.length > 150 && (
                          <button onClick={() => setExpandedId(isExpanded ? null : post.id)}
                            className="text-emerald-600 text-[12px] font-semibold mt-1 hover:underline">
                            {isExpanded ? 'Show less' : 'Read more'}
                          </button>
                        )}
                        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                          <button onClick={() => handleLike(post.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                              post.likedByMe ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-100'
                            }`}>
                            <Heart className={`h-3.5 w-3.5 transition-transform ${post.likedByMe ? 'fill-red-500 text-red-500 animate-heart-pop' : ''}`} />
                            {post.likesCount > 0 && post.likesCount}
                          </button>
                          <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-500 hover:bg-gray-100 transition-all">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {post.commentsCount > 0 && post.commentsCount}
                          </button>
                          <button onClick={() => handleSave(post.id)}
                            className={`ml-auto p-1.5 rounded-full transition-all ${
                              post.savedByMe ? 'text-purple-500' : 'text-gray-400 hover:bg-gray-100'
                            }`}>
                            {post.savedByMe ? <BookmarkCheck className="h-3.5 w-3.5 fill-purple-600" /> : <Bookmark className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => handleDelete(post.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tours */}
        {activeTab === 'tours' && (
          <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 shadow-sm animate-fade-up">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <Compass className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-gray-700 font-semibold mb-0.5">
              {toursCount > 0 ? `${toursCount} tour${toursCount > 1 ? 's' : ''} listed` : 'No tours yet'}
            </p>
            <p className="text-[13px] text-gray-400 mb-4">Manage your tour listings from the Tours section.</p>
            <Link href="/travel-agent/tours" className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-semibold transition-all">
              <Compass className="h-4 w-4" /> Go to My Tours
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
