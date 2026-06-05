'use client';

// Agent-side Travel Network — design parity port of /vendor/social.
// Same layout, same animations, same components — only differences:
//   * API endpoints point to the shared /api/social/*
//   * Internal links point to /travel-agent/social/*
//   * Header label says "Travel Network" instead of "Vendor Network"
//   * Ownership / follow logic uses agent identity (cross-type follow is
//     Phase 2, so the Follow button is hidden here for now)

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Heart, MessageCircle, Bookmark, Share2, Plus, MoreVertical,
  Trash2, Building2, MapPin, Clock, X, Send, Zap, BookmarkCheck,
  ChevronLeft, ChevronRight, PenSquare, TrendingUp, MessageSquare, Users,
  Sparkles, Users2, Bookmark as BookmarkIcon, Home, Rss, Search,
  CheckCircle2, Flame, Bell, ChevronDown, AlertOctagon, Truck, Megaphone,
  AlertTriangle, User, Compass,
} from 'lucide-react';

/* ─── Types ─── */
interface AuthorBase { id: string; businessName: string; ownerName: string; logo?: string; city?: string; }
interface Category { id: string; name: string; isSOS: boolean; }
interface Post {
  id: string; content: string; images?: string[]; createdAt: string;
  vendor: AuthorBase; category: Category;
  author?: { type: 'vendor' | 'agent'; id: string; name: string; ownerName: string | null; logo: string | null; city: string | null };
  likedByMe: boolean; savedByMe: boolean; followedByMe: boolean;
  likesCount: number; commentsCount: number;
  vendorId?: string | null; agentId?: string | null;
}
interface Comment { id: string; content: string; createdAt: string; vendor: AuthorBase; author?: { type: 'vendor' | 'agent'; id: string; name: string; ownerName: string | null; logo: string | null }; }
interface AuthorStoryGroup { vendor: AuthorBase; posts: Post[]; }

/* ─── Helpers ─── */
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

function groupSOSByAuthor(posts: any[]): AuthorStoryGroup[] {
  const map = new Map<string, AuthorStoryGroup>();
  for (const p of posts) {
    const key: string = p.vendorId ?? p.agentId ?? p.vendor?.id ?? p.agent?.id;
    if (!map.has(key)) map.set(key, { vendor: p.vendor, posts: [] });
    map.get(key)!.posts.push(p);
  }
  return Array.from(map.values());
}

/* ─── Avatar (vendor or agent — uses the synthetic `vendor` field served by the API) ─── */
function NetworkAvatar({ vendor, size = 40 }: { vendor: { businessName: string; logo?: string }; size?: number }) {
  const [err, setErr] = useState(false);
  const palette = [
    'bg-green-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
  ];
  const color = palette[vendor.businessName.charCodeAt(0) % palette.length];
  if (vendor.logo && !err) {
    return (
      <img src={vendor.logo} alt={vendor.businessName} onError={() => setErr(true)}
        className="rounded-full object-cover flex-shrink-0 ring-2 ring-white"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className={`${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none ring-2 ring-white`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>
      {vendor.businessName.charAt(0).toUpperCase()}
    </div>
  );
}

/* ══════════════════════════════════════
   Story Viewer
══════════════════════════════════════ */
const STORY_DURATION = 6000;
const TICK = 50;

function StoryViewer({ groups, initialVendorIdx, onClose }: {
  groups: AuthorStoryGroup[]; initialVendorIdx: number; onClose: () => void;
}) {
  const [vendorIdx, setVendorIdx] = useState(initialVendorIdx);
  const [postIdx, setPostIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());
  const elapsed0Ref = useRef<number>(0);

  const currentGroup = groups[vendorIdx];
  const currentPost = currentGroup?.posts[postIdx];
  const totalVendors = groups.length;
  const totalPosts = currentGroup?.posts.length ?? 1;

  const goToVendor = useCallback((vi: number, pi = 0) => {
    if (vi < 0 || vi >= totalVendors) { onClose(); return; }
    setVendorIdx(vi); setPostIdx(pi); setProgress(0); elapsed0Ref.current = 0;
  }, [totalVendors, onClose]);

  const goNext = useCallback(() => {
    if (postIdx < totalPosts - 1) { setPostIdx(p => p + 1); setProgress(0); elapsed0Ref.current = 0; }
    else goToVendor(vendorIdx + 1, 0);
  }, [postIdx, totalPosts, vendorIdx, goToVendor]);

  const goPrev = useCallback(() => {
    if (postIdx > 0) { setPostIdx(p => p - 1); setProgress(0); elapsed0Ref.current = 0; }
    else if (vendorIdx > 0) goToVendor(vendorIdx - 1, groups[vendorIdx - 1].posts.length - 1);
  }, [postIdx, vendorIdx, groups, goToVendor]);

  useEffect(() => {
    startRef.current = Date.now(); setProgress(0); elapsed0Ref.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (paused) return;
      const elapsed = elapsed0Ref.current + (Date.now() - startRef.current);
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(timerRef.current!); goNext(); }
    }, TICK);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorIdx, postIdx]);

  useEffect(() => {
    if (paused) {
      elapsed0Ref.current += Date.now() - startRef.current;
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = elapsed0Ref.current + (Date.now() - startRef.current);
        const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
        setProgress(pct);
        if (pct >= 100) { clearInterval(timerRef.current!); goNext(); }
      }, TICK);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [goNext, goPrev, onClose]);

  if (!currentPost) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={onClose}>
      <div className="relative flex flex-col" style={{ width: '100%', maxWidth: 400, height: '92vh', maxHeight: 720, margin: '0 16px' }}
        onClick={e => e.stopPropagation()}>
        {totalVendors > 1 && (
          <div className="flex items-center justify-center gap-2 mb-3 relative z-20">
            {groups.map((g, vi) => (
              <button key={g.vendor.id} onClick={() => goToVendor(vi, 0)}
                className={`transition-all duration-200 rounded-full overflow-hidden border-2 ${vi === vendorIdx ? 'border-white scale-110' : 'border-white/30 opacity-50'}`}
                style={{ width: 28, height: 28 }}>
                <NetworkAvatar vendor={g.vendor} size={24} />
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(155deg, #0f0c29 0%, #1a1640 40%, #24243e 100%)' }}>
          <div className="flex gap-1 p-3 pb-0 relative z-20">
            {currentGroup.posts.map((_, pi) => (
              <div key={pi} className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/20">
                <div className="h-full bg-white rounded-full" style={{ width: pi < postIdx ? '100%' : pi === postIdx ? `${progress}%` : '0%', transition: pi === postIdx ? 'none' : undefined }} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 px-4 pt-3 pb-2 relative z-20">
            <div>
              <div className="p-[2px] rounded-full bg-gradient-to-br from-red-500 to-orange-400">
                <div className="p-[2px] bg-gray-900 rounded-full">
                  <NetworkAvatar vendor={currentPost.vendor} size={40} />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">{currentPost.vendor.businessName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {currentPost.vendor.city && <span className="flex items-center gap-0.5 text-white/50 text-[11px]"><MapPin className="h-2.5 w-2.5" />{currentPost.vendor.city}</span>}
                <span className="text-white/40 text-[11px]">{timeAgo(currentPost.createdAt)}</span>
                {totalPosts > 1 && <span className="text-white/40 text-[11px] ml-auto">{postIdx + 1}/{totalPosts}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30"><Zap className="h-2.5 w-2.5" /> SOS</span>
              <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex-1 flex items-center px-5 py-4">
            <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap font-medium">{currentPost.content}</p>
          </div>
          {totalVendors > 1 && (
            <div className="flex items-center justify-between px-4 pb-3">
              <button onClick={() => goToVendor(vendorIdx - 1, 0)} disabled={vendorIdx === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium disabled:opacity-0 transition-all">
                <ChevronLeft className="h-3.5 w-3.5" />{vendorIdx > 0 && <span className="max-w-[80px] truncate">{groups[vendorIdx - 1].vendor.businessName}</span>}
              </button>
              <button onClick={() => goToVendor(vendorIdx + 1, 0)} disabled={vendorIdx === totalVendors - 1} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium disabled:opacity-0 transition-all">
                {vendorIdx < totalVendors - 1 && <span className="max-w-[80px] truncate">{groups[vendorIdx + 1].vendor.businessName}</span>}<ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="px-4 pb-4 flex gap-2 relative z-20">
            <button onClick={() => { const t = `*SOS* from ${currentPost.vendor.businessName}:\n\n${currentPost.content}\n\n— via TransRentals`; window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank'); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors">
              <Share2 className="h-4 w-4" /> WhatsApp
            </button>
            <Link href={`/travel-agent/social/profile/${currentPost.author?.type ?? 'vendor'}/${currentPost.author?.id ?? currentPost.vendor.id}`}
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/15 transition-colors">
              <Building2 className="h-4 w-4" /> Profile
            </Link>
          </div>
        </div>
        <button className="absolute left-0 z-10 cursor-pointer" style={{ top: totalVendors > 1 ? 44 : 0, bottom: 0, width: '35%' }}
          onClick={goPrev} onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)} aria-label="Previous" />
        <button className="absolute right-0 z-10 cursor-pointer" style={{ top: totalVendors > 1 ? 44 : 0, bottom: 0, width: '35%' }}
          onClick={goNext} onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)} aria-label="Next" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   SOS Story Strip
══════════════════════════════════════ */
function SOSStories({ groups, onOpen }: { groups: AuthorStoryGroup[]; onOpen: (vi: number) => void }) {
  if (!groups.length) return null;
  const totalPosts = groups.reduce((s, g) => s + g.posts.length, 0);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-4 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
          <Zap className="h-3 w-3" /> SOS
        </span>
        <span className="text-sm font-medium text-red-700">Urgent Requests</span>
        <span className="ml-auto text-xs text-red-400 font-medium">{totalPosts} active</span>
      </div>
      <div className="flex gap-4 pb-0.5" style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {groups.map((g, vi) => (
          <button key={g.vendor.id} onClick={() => onOpen(vi)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
            <div className="relative p-[2.5px] rounded-full bg-gradient-to-br from-red-500 via-orange-400 to-yellow-300 shadow-md group-hover:shadow-lg transition-shadow">
              <div className="p-[2px] bg-white rounded-full">
                <NetworkAvatar vendor={g.vendor} size={52} />
              </div>
              {g.posts.length > 1 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center border-2 border-white">
                  {g.posts.length}
                </span>
              )}
            </div>
            <span className="text-[11px] text-red-700 font-medium max-w-[58px] truncate text-center">{g.vendor.businessName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Comment Modal
══════════════════════════════════════ */
function CommentModal({ post, currentAgentId, onClose }: { post: Post; currentAgentId?: string; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/social/posts/${post.id}/comment`).then(r => r.json())
      .then(d => { setComments(d.comments || []); setLoading(false); });
  }, [post.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/social/posts/${post.id}/comment`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }),
    });
    const data = await res.json();
    if (res.ok) { setComments(p => [...p, data.comment]); setText(''); }
    setSubmitting(false);
  };

  const deleteComment = async (cid: string) => {
    await fetch(`/api/social/posts/${post.id}/comment/${cid}`, { method: 'DELETE' });
    setComments(p => p.filter(c => c.id !== cid));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 backdrop-blur-md">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900">Comments</p>
            <p className="text-xs text-gray-400 mt-0.5">{post.vendor.businessName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed italic">&quot;{post.content}&quot;</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full" /></div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10">
              <MessageCircle className="h-10 w-10 text-gray-200 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-gray-400 text-sm font-medium">No comments yet</p>
              <p className="text-gray-300 text-xs mt-1">Be the first to comment!</p>
            </div>
          ) : comments.map(c => {
            const isMine = c.author?.type === 'agent' && c.author?.id === currentAgentId;
            return (
              <div key={c.id} className="flex gap-3">
                <NetworkAvatar vendor={c.vendor} size={34} />
                <div className="flex-1 bg-gray-50 rounded-2xl px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-900">{c.vendor.businessName}</span>
                    <span className="text-[10px] text-gray-400">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">{c.content}</p>
                </div>
                {isMine && (
                  <button onClick={() => deleteComment(c.id)} className="text-gray-300 hover:text-red-400 self-start pt-2 transition-colors flex-shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <form onSubmit={submit} className="flex gap-2">
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Add a comment..."
              className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent shadow-sm" />
            <button type="submit" disabled={submitting || !text.trim()}
              className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 disabled:opacity-40 transition-colors flex-shrink-0">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Canvas Post Card Generator
══════════════════════════════════════ */
async function generatePostCard(post: Post): Promise<Blob> {
  const W = 800, H = 480;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const sos = post.category.isSOS;
  const accent1 = sos ? '#ef4444' : '#7c3aed';
  const accent2 = sos ? '#f97316' : '#a855f7';

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 0, 0, W, H, 0);

  const bar = ctx.createLinearGradient(0, 0, W, 0);
  bar.addColorStop(0, accent1); bar.addColorStop(1, accent2);
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, W, 10);

  ctx.fillStyle = sos ? '#fff7f7' : '#faf5ff';
  ctx.fillRect(0, 10, W, H - 10);

  const av = { x: 52, y: 72, r: 28 };
  ctx.fillStyle = accent1;
  ctx.beginPath(); ctx.arc(av.x, av.y, av.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(post.vendor.businessName.charAt(0).toUpperCase(), av.x, av.y);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText(post.vendor.businessName, 92, 64);

  ctx.fillStyle = '#6b7280';
  ctx.font = '15px system-ui, -apple-system, sans-serif';
  ctx.fillText(post.vendor.ownerName || '', 92, 85);

  const catText = (sos ? '⚡ ' : '') + post.category.name;
  const catW = ctx.measureText(catText).width + 24;
  ctx.fillStyle = sos ? '#fee2e2' : '#ede9fe';
  roundRect(ctx, 92, 95, catW, 24, 12);
  ctx.fillStyle = sos ? '#dc2626' : '#7c3aed';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(catText, 104, 112);

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 136); ctx.lineTo(W - 40, 136); ctx.stroke();

  ctx.fillStyle = '#1f2937';
  ctx.font = '18px system-ui, -apple-system, sans-serif';
  const maxW = W - 80;
  const lines: string[] = [];
  const words = post.content.split(' ');
  let line = '';
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line); line = word;
      if (lines.length >= 7) { lines[lines.length - 1] += '...'; break; }
    } else { line = test; }
  }
  if (line && lines.length < 7) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, 40, 168 + i * 30));

  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(0, H - 44, W, 44);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H - 44); ctx.lineTo(W, H - 44); ctx.stroke();

  ctx.fillStyle = accent1;
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('TransRentals', 40, H - 15);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillText('Travel Network', 130, H - 15);

  return new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(), 'image/png'));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

/* ══════════════════════════════════════
   Share In Chat Modal
══════════════════════════════════════ */
function ShareInChatModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/social/chat/conversations')
      .then(r => r.json())
      .then(d => { setConversations(d.conversations || []); setLoading(false); });
  }, []);

  const shareToChat = async (convId: string) => {
    if (sending || sent) return;
    setSending(convId);
    const content = JSON.stringify({
      __type: 'post_card',
      vendorName: post.vendor.businessName,
      ownerName: post.vendor.ownerName,
      category: post.category.name,
      isSOS: post.category.isSOS,
      content: post.content,
    });
    await fetch(`/api/social/chat/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    setSent(convId);
    setSending(null);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-600" /> Share in Chat
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
          <p className="text-[11px] text-emerald-700 font-semibold mb-1">{post.vendor.businessName} · {post.category.name}</p>
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{post.content}</p>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400 font-medium">No conversations yet</p>
            <p className="text-xs text-gray-300 mt-1">Start a chat first from a profile</p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto py-2">
            {conversations.map((conv: any) => (
              <button key={conv.id} onClick={() => shareToChat(conv.id)}
                disabled={!!sending || !!sent}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-60 text-left">
                <NetworkAvatar vendor={conv.other} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{conv.other.businessName}</p>
                  <p className="text-xs text-gray-400 truncate">{conv.other.city || conv.other.ownerName}</p>
                </div>
                {sent === conv.id ? (
                  <span className="text-xs text-emerald-600 font-bold">Sent!</span>
                ) : sending === conv.id ? (
                  <div className="animate-spin h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full flex-shrink-0" />
                ) : (
                  <Send className="h-4 w-4 text-gray-300 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Post Card
══════════════════════════════════════ */
function PostCard({ post, currentAgentId, onLike, onSave, onDelete, onComment, onShareInChat }: {
  post: Post; currentAgentId?: string;
  onLike: (id: string) => void; onSave: (id: string) => void;
  onDelete: (id: string) => void; onComment: (post: Post) => void;
  onShareInChat: (post: Post) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAgentAuthor = post.author?.type === 'agent';
  const isVendorAuthor = post.author?.type === 'vendor';
  const isOwner = isAgentAuthor && post.author?.id === currentAgentId;
  const isLongContent = post.content.length > 150;

  const isOld = (Date.now() - new Date(post.createdAt).getTime()) > 7 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  const shareWA = async () => {
    try {
      const blob = await generatePostCard(post);
      const file = new File([blob], 'post.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${post.vendor.businessName} on Travel Network` });
        return;
      }
    } catch {}
    const t = `*${post.vendor.businessName}* — _${post.category.name}_\n\n${post.content}\n\n— via TransRentals Travel Network`;
    window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank');
  };

  const isSOS = post.category.isSOS;
  const isRecent = (Date.now() - new Date(post.createdAt).getTime()) < 60 * 60 * 1000;

  const themes = [
    { bg: 'bg-gradient-to-b from-blue-500 to-blue-600', tint: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-400', badge: 'bg-blue-600 text-white' },
    { bg: 'bg-gradient-to-b from-purple-500 to-purple-600', tint: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-400', badge: 'bg-purple-600 text-white' },
    { bg: 'bg-gradient-to-b from-emerald-500 to-emerald-600', tint: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-400', badge: 'bg-emerald-600 text-white' },
    { bg: 'bg-gradient-to-b from-amber-500 to-amber-600', tint: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-400', badge: 'bg-amber-600 text-white' },
    { bg: 'bg-gradient-to-b from-indigo-500 to-indigo-600', tint: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-400', badge: 'bg-indigo-600 text-white' },
    { bg: 'bg-gradient-to-b from-cyan-500 to-cyan-600', tint: 'bg-cyan-50', text: 'text-cyan-700', ring: 'ring-cyan-400', badge: 'bg-cyan-600 text-white' },
  ];
  const sosTheme = { bg: 'bg-gradient-to-b from-red-600 to-red-700', tint: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-500', badge: 'bg-red-700 text-white' };
  const colorIdx = post.category.name.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % themes.length;
  const theme = isSOS ? sosTheme : themes[colorIdx];

  return (
    <div className={`group relative rounded-3xl overflow-hidden transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:-translate-y-1.5 ${isOld ? 'opacity-70' : ''}`}>

      <div className={`${theme.bg} px-5 py-4 relative overflow-hidden`}>
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
              {isSOS ? <><Zap className="w-3.5 h-3.5" /> SOS</> : post.category.name}
            </span>
            {isSOS && isRecent && (
              <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                LIVE
              </span>
            )}
          </div>
          <span className="text-white/70 text-[11px] font-medium">{timeAgo(post.createdAt)}</span>
        </div>
      </div>

      <div className="bg-white">
        <div className="px-5 pt-4 pb-2 flex items-center gap-3">
          <Link href={`/travel-agent/social/profile/${post.author?.type ?? 'vendor'}/${post.author?.id ?? post.vendor.id}`}
            className="flex items-center gap-3 flex-1 min-w-0 group/profile">
            <div className="flex-shrink-0">
              <div className={`rounded-full ring-2 ${theme.ring} ring-offset-2`}>
                <NetworkAvatar vendor={post.vendor} size={40} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[15px] font-bold text-gray-900 leading-tight truncate block group-hover/profile:text-emerald-600 transition-colors">
                {post.vendor.businessName}
              </span>
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                {isAgentAuthor && (
                  <span className="inline-flex items-center gap-0.5 bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    Travel Agent
                  </span>
                )}
                {isVendorAuthor && (
                  <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    Vendor
                  </span>
                )}
                {post.vendor.city && <>{post.vendor.city} · </>}{new Date(post.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </p>
            </div>
          </Link>

          {isOwner && (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-xl z-20 min-w-[170px] py-1 overflow-hidden">
                  <button onClick={() => { onDelete(post.id); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-[14px] text-red-600 hover:bg-red-50 flex items-center gap-2.5">
                    <Trash2 className="h-4 w-4" /> Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-4">
          <p className={`text-[15px] font-normal leading-[1.75] text-gray-700 whitespace-pre-wrap ${expanded ? '' : 'line-clamp-3'}`}>{post.content}</p>
          {isLongContent && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="mt-1 text-[12px] font-semibold text-purple-600 hover:text-purple-800 transition-colors"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
          {Array.isArray(post.images) && post.images.length > 0 && (
            <div className={`mt-3 grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {post.images.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer"
                  className={`block overflow-hidden rounded-xl border border-gray-100 ${post.images!.length === 3 && i === 0 ? 'col-span-2' : ''}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full max-h-80 object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={() => onLike(post.id)} title="Like"
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                post.likedByMe ? 'bg-red-50 text-red-600' : 'hover:bg-gray-100 text-gray-600'
              }`}>
              <Heart className={`w-4 h-4 transition-transform ${post.likedByMe ? 'fill-red-500 text-red-500 animate-heart-pop' : ''}`} />
              {post.likesCount > 0 && post.likesCount}
            </button>
            <button onClick={() => onComment(post)} title="Comment"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold text-gray-600 hover:bg-gray-100 transition-all">
              <MessageCircle className="w-4 h-4" />
              {post.commentsCount > 0 && post.commentsCount}
            </button>
            <button onClick={() => onShareInChat(post)} title="Share in chat"
              className="inline-flex items-center px-2.5 py-1.5 rounded-full text-gray-600 hover:bg-gray-100 transition-all">
              <Send className="w-4 h-4" />
            </button>
            <button onClick={shareWA} title="Share to other app"
              className="inline-flex items-center px-2.5 py-1.5 rounded-full text-gray-600 hover:bg-gray-100 transition-all">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => onSave(post.id)} title="Save"
            className={`p-2 rounded-full transition-all ${
              post.savedByMe ? 'text-purple-500' : 'text-gray-500 hover:bg-gray-100'
            }`}>
            {post.savedByMe
              ? <BookmarkCheck className="w-4 h-4 fill-purple-600 animate-bounce-soft" />
              : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {isSOS && onComment && (
          <div className="px-5 pb-4 flex justify-end">
            <button
              onClick={() => onComment(post)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold rounded-lg transition-all inline-flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm hover:shadow-lg hover:shadow-red-300/50"
            >
              <Zap className="w-3.5 h-3.5" /> Respond
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

/* ─── Skeleton ─── */
function PostSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-none sm:rounded-2xl p-4 animate-pulse shadow-none sm:shadow-sm">
      <div className="flex gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-gray-100 rounded-full w-2/5" />
          <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
          <div className="h-2 bg-gray-100 rounded-full w-1/3" />
        </div>
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="space-y-2.5 mb-4">
        <div className="h-3 bg-gray-100 rounded-full" />
        <div className="h-3 bg-gray-100 rounded-full w-11/12" />
        <div className="h-3 bg-gray-100 rounded-full w-4/5" />
        <div className="h-3 bg-gray-100 rounded-full w-3/5" />
      </div>
      <div className="h-px bg-gray-100 mb-3" />
      <div className="flex gap-2">
        <div className="h-8 w-16 bg-gray-100 rounded-xl" />
        <div className="h-8 w-16 bg-gray-100 rounded-xl" />
        <div className="h-8 w-10 bg-gray-100 rounded-xl ml-auto" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Main Feed
══════════════════════════════════════ */
function SocialFeedContent() {
  const { data: session } = useSession();
  const [currentAgentId, setCurrentAgentId] = useState<string | undefined>(undefined);
  const [currentAgencyName, setCurrentAgencyName] = useState<string>('Agent');
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<Post[]>([]);
  const [sosPosts, setSosPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [shareInChatPost, setShareInChatPost] = useState<Post | null>(null);
  const [storyVendorIdx, setStoryVendorIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'saved'>(
    searchParams.get('tab') === 'saved' ? 'saved' : 'feed'
  );
  const [feedFilter, setFeedFilter] = useState<'all' | 'sos' | 'general'>('all');
  const [showGibberish, setShowGibberish] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [oldSOSCollapsed, setOldSOSCollapsed] = useState(true);

  // Resolve the current agent's id + agency name for ownership + Account card.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/travel-agent/profile');
        if (res.ok) {
          const data = await res.json();
          setCurrentAgentId(data?.id);
          setCurrentAgencyName(data?.agencyName || 'Agent');
        }
      } catch {}
    })();
  }, []);

  const filteredPosts = posts
    .filter(p =>
      feedFilter === 'all' ||
      (feedFilter === 'sos' && p.category.isSOS) ||
      (feedFilter === 'general' && !p.category.isSOS)
    )
    .filter(p => showGibberish || !p.category.isSOS || p.content.trim().length >= 10)
    .filter(p => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const author = p.author?.name || (p as any).vendor?.businessName || (p as any).agent?.agencyName || '';
      const hay = [p.content, author, p.category?.name].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });

  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const oldSOSCount = filteredPosts.filter(
    p => p.category.isSOS && (Date.now() - new Date(p.createdAt).getTime()) > SEVEN_DAYS
  ).length;
  const visiblePosts = oldSOSCollapsed
    ? filteredPosts.filter(
        p => !(p.category.isSOS && (Date.now() - new Date(p.createdAt).getTime()) > SEVEN_DAYS)
      )
    : filteredPosts;
  const sortedPosts = [...visiblePosts].sort((a, b) => {
    if (a.category.isSOS !== b.category.isSOS) return a.category.isSOS ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const sosGroups = groupSOSByAuthor(sosPosts);

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/social/categories');
    const data = await res.json();
    setCategories((data.categories || []).filter((c: any) => c.isActive && !c.isSOS));
  };

  const fetchSOS = async () => {
    const data = await (await fetch('/api/social/posts?type=sos')).json();
    setSosPosts(data.posts || []);
  };

  const fetchFeed = useCallback(async (catId?: string, cursor?: string) => {
    const p = new URLSearchParams();
    if (catId) p.set('categoryId', catId);
    if (cursor) p.set('cursor', cursor);
    return (await fetch(`/api/social/posts?${p}`)).json();
  }, []);

  const fetchSaved = useCallback(async (cursor?: string) => {
    const p = new URLSearchParams({ type: 'saved' });
    if (cursor) p.set('cursor', cursor);
    return (await fetch(`/api/social/posts?${p}`)).json();
  }, []);

  const load = useCallback(async (catId?: string) => {
    setLoading(true);
    const data = activeTab === 'saved' ? await fetchSaved() : await fetchFeed(catId ?? selectedCategory);
    setPosts(data.posts || []);
    setNextCursor(data.nextCursor || null);
    setLoading(false);
  }, [activeTab, selectedCategory, fetchFeed, fetchSaved]);

  useEffect(() => { fetchCategories(); fetchSOS(); }, []);
  useEffect(() => { load(); }, [activeTab, selectedCategory]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const data = activeTab === 'saved' ? await fetchSaved(nextCursor) : await fetchFeed(selectedCategory, nextCursor);
    setPosts(prev => [...prev, ...(data.posts || [])]);
    setNextCursor(data.nextCursor || null);
    setLoadingMore(false);
  };

  const handleLike = async (postId: string) => {
    const res = await fetch(`/api/social/posts/${postId}/like`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: data.liked, likesCount: data.likesCount } : p));
  };

  const handleSave = async (postId: string) => {
    const res = await fetch(`/api/social/posts/${postId}/save`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, savedByMe: data.saved } : p)
          .filter(p => activeTab === 'saved' ? p.savedByMe : true)
    );
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    const res = await fetch(`/api/social/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] -m-4 sm:-m-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-20 sm:pb-0">
      <style jsx global>{`
        @keyframes fade-up { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pop-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
        .animate-pop-in { animation: pop-in 0.4s ease-out both; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes bounce-soft { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes wiggle { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } }
        @keyframes glow-red { 0%,100% { box-shadow: 0 0 8px rgba(239,68,68,0.3); } 50% { box-shadow: 0 0 20px rgba(239,68,68,0.6); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes heart-pop { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .animate-bounce-soft { animation: bounce-soft 2s ease-in-out infinite; }
        .animate-wiggle { animation: wiggle 1s ease-in-out infinite; }
        .animate-glow-red { animation: glow-red 2s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.4s ease-out both; }
        .animate-heart-pop { animation: heart-pop 0.3s ease-out; }
      `}</style>

      {/* ── Sticky Header (Top Bar) ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between py-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-gray-900 leading-none">Travel Network</h1>
              <p className="text-[11px] text-gray-500 font-medium">by TransRentals</p>
            </div>
          </div>
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search posts by content, author, category..." className="w-full pl-10 pr-4 py-2 bg-gray-100 hover:bg-gray-50 focus:bg-white border border-transparent focus:border-purple-300 focus:ring-2 focus:ring-purple-100 rounded-full text-sm outline-none transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button className="group relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors" title="Notifications">
              <Bell className="w-[18px] h-[18px] group-hover:animate-wiggle" />
            </button>
            <Link href="/travel-agent/social/messages" className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors" title="Messages">
              <MessageCircle className="w-[18px] h-[18px]" />
            </Link>
            <Link href="/travel-agent/social/profile/me" className="ml-1 flex-shrink-0" title="Profile">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <span className="text-[11px] font-semibold text-white">ME</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Story / Quick Action Row ── */}
      <div className="bg-white border-b border-gray-100 py-4 px-4 sm:px-6 overflow-visible">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x">
          <Link href="/travel-agent/social/create" className="group flex flex-col items-center gap-2 flex-shrink-0 snap-start">
            <div className="p-[3px] rounded-full bg-gradient-to-br from-red-500 via-rose-500 to-orange-500 shadow-lg shadow-red-200/50 group-hover:shadow-xl group-hover:shadow-red-300/60 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white flex items-center justify-center group-hover:bg-red-50 transition-colors">
                <AlertOctagon className="w-6 h-6 sm:w-7 sm:h-7 text-red-500 animate-wiggle" />
              </div>
            </div>
            <span className="text-[11px] sm:text-[12px] font-semibold text-gray-700 group-hover:text-red-600 transition-colors">SOS Post</span>
          </Link>
          <Link href="/travel-agent/social/create" className="group flex flex-col items-center gap-2 flex-shrink-0 snap-start">
            <div className="p-[3px] rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-lg shadow-blue-200/50 group-hover:shadow-xl group-hover:shadow-blue-300/60 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <PenSquare className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <span className="text-[11px] sm:text-[12px] font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">Post General</span>
          </Link>
          <Link href="/travel-agent/tours" className="group flex flex-col items-center gap-2 flex-shrink-0 snap-start">
            <div className="p-[3px] rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-purple-200/50 group-hover:shadow-xl group-hover:shadow-purple-300/60 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white flex items-center justify-center group-hover:bg-purple-50 transition-colors">
                <Compass className="w-6 h-6 sm:w-7 sm:h-7 text-purple-500 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
            <span className="text-[11px] sm:text-[12px] font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">My Tours</span>
          </Link>
          <Link href="/travel-agent/social/messages" className="group flex flex-col items-center gap-2 flex-shrink-0 snap-start">
            <div className="p-[3px] rounded-full bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 shadow-lg shadow-emerald-200/50 group-hover:shadow-xl group-hover:shadow-emerald-300/60 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500 animate-bounce-soft" />
              </div>
            </div>
            <span className="text-[11px] sm:text-[12px] font-semibold text-gray-700 group-hover:text-emerald-600 transition-colors">Messages</span>
          </Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-gray-200 sticky top-[57px] z-20">
        <div className="flex sm:inline-flex sm:gap-0">
          <button
            onClick={() => { setActiveTab('feed'); setFeedFilter('all'); }}
            className={`flex-1 sm:flex-initial sm:px-4 py-3 text-[14px] font-medium transition-all duration-300 ${
              activeTab === 'feed' && feedFilter === 'all'
                ? 'border-b-[3px] border-purple-600 text-purple-800 font-bold'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            For You
          </button>
          <button
            onClick={() => { setActiveTab('feed'); setFeedFilter('sos'); }}
            className={`flex-1 sm:flex-initial sm:px-4 py-3 text-[14px] font-medium transition-all duration-300 inline-flex items-center justify-center gap-1.5 ${
              activeTab === 'feed' && feedFilter === 'sos'
                ? 'border-b-[3px] border-red-500 text-red-700 font-bold'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            SOS <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </button>
          <button
            onClick={() => { setActiveTab('feed'); setFeedFilter('general'); }}
            className={`flex-1 sm:flex-initial sm:px-4 py-3 text-[14px] font-medium transition-all duration-300 ${
              activeTab === 'feed' && feedFilter === 'general'
                ? 'border-b-[3px] border-purple-600 text-purple-800 font-bold'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            General
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 sm:flex-initial sm:px-4 py-3 text-[14px] font-medium transition-all duration-300 ${
              activeTab === 'saved'
                ? 'border-b-[3px] border-purple-600 text-purple-800 font-bold'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            Saved
          </button>
        </div>
      </div>

      {/* ── Category Chips ── */}
      {activeTab === 'feed' && categories.length > 0 && (
        <div className="px-4 py-2 bg-white border-b border-gray-50">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide snap-x">
            {[{ id: '', name: 'All' }, ...categories].map(cat => (
              <button key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                className={`snap-start px-3 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                {cat.name}
              </button>
            ))}
            <button onClick={() => setShowGibberish(s => !s)} className="ml-auto flex-shrink-0 text-[11px] text-gray-500 hover:text-purple-600 underline-offset-2 hover:underline whitespace-nowrap">
              {showGibberish ? 'Hide flagged' : 'Show flagged'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 px-1 py-0 sm:py-4">
        <div className="min-w-0 space-y-3 sm:space-y-4">

          {sosGroups.length > 0 && (
            <div className="px-0 sm:px-0">
              <SOSStories groups={sosGroups} onOpen={vi => setStoryVendorIdx(vi)} />
            </div>
          )}

          {loading ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="mb-4 break-inside-avoid">
                  <PostSkeleton />
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-none sm:rounded-2xl shadow-none sm:shadow-sm animate-pop-in">
              <div className="mx-auto w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                {activeTab === 'saved'
                  ? <BookmarkIcon className="h-7 w-7 text-purple-600" />
                  : <MessageCircle className="h-7 w-7 text-purple-600" />}
              </div>
              <p className="font-semibold text-gray-900 text-[16px]">
                {activeTab === 'saved' ? 'No saved posts yet' : selectedCategory ? 'No posts in this category' : 'No posts yet'}
              </p>
              <p className="text-[14px] text-gray-500 mt-1.5 font-normal">
                {activeTab === 'saved' ? 'Bookmark posts to find them here' : 'Be the first to share something!'}
              </p>
              {activeTab === 'feed' && (
                <Link href="/travel-agent/social/create"
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[13px] font-semibold transition-all active:scale-95">
                  <PenSquare className="h-4 w-4" /> Create Post
                </Link>
              )}
            </div>
          ) : (
            <>
              {oldSOSCount > 0 && (
                <button onClick={() => setOldSOSCollapsed(c => !c)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[11px] text-gray-500 font-medium hover:bg-gray-50 hover:text-gray-700 transition-colors">
                  {oldSOSCollapsed ? `Show ${oldSOSCount} older SOS post${oldSOSCount > 1 ? 's' : ''} (>7 days)` : `Hide older SOS posts`}
                </button>
              )}
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
                {sortedPosts.map(post => (
                  <div key={post.id} className="break-inside-avoid mb-6 animate-slide-up">
                    <PostCard post={post} currentAgentId={currentAgentId}
                      onLike={handleLike} onSave={handleSave} onDelete={handleDelete}
                      onComment={setCommentPost} onShareInChat={setShareInChatPost} />
                  </div>
                ))}
              </div>
            </>
          )}
          {!loading && posts.length > 0 && nextCursor && (
            <button onClick={loadMore} disabled={loadingMore}
              className="w-full py-3 text-[13px] font-semibold text-purple-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-2xl disabled:opacity-50 transition-colors">
              {loadingMore ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full inline-block" />
                  Loading...
                </span>
              ) : 'Load more posts'}
            </button>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <aside className="hidden lg:block space-y-4 sticky top-[130px] self-start pt-0">
          <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-[13px] font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" /> Quick Post
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/travel-agent/social/create" className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 text-[12px] font-semibold transition-colors active:scale-95">
                <Zap className="w-3.5 h-3.5" /> SOS
              </Link>
              <Link href="/travel-agent/social/create" className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 text-[12px] font-semibold transition-colors active:scale-95">
                <PenSquare className="w-3.5 h-3.5" /> General
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-[13px] font-semibold text-gray-700 mb-3">Account</h3>
            <p className="text-[12px] text-gray-500 mb-3 truncate">Hi, <span className="font-semibold text-gray-800">{currentAgencyName}</span></p>
            <ul className="space-y-1">
              <li>
                <Link href="/travel-agent/social/profile/me" className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-2 -mx-3 text-[13px] text-gray-700 hover:text-purple-700 transition-colors">
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/travel-agent/social/saved" className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-2 -mx-3 text-[13px] text-gray-700 hover:text-purple-700 transition-colors">
                  Saved
                </Link>
              </li>
              <li>
                <Link href="/travel-agent/social/messages" className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-2 -mx-3 text-[13px] text-gray-700 hover:text-purple-700 transition-colors">
                  Messages
                </Link>
              </li>
              <li>
                <Link href="/travel-agent/profile" className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-2 -mx-3 text-[13px] text-gray-700 hover:text-purple-700 transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <h3 className="text-[13px] font-semibold text-gray-700 mb-3">Feed Stats</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <div className="text-[16px] font-bold text-gray-900">{posts.length}</div>
                <div className="text-[10px] text-gray-500">Posts</div>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <div className="text-[16px] font-bold text-gray-900">{posts.filter(p => p.category.isSOS).length}</div>
                <div className="text-[10px] text-gray-500">SOS</div>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                <div className="text-[16px] font-bold text-gray-900">{posts.filter(p => p.savedByMe).length}</div>
                <div className="text-[10px] text-gray-500">Saved</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {storyVendorIdx !== null && sosGroups.length > 0 && (
        <StoryViewer groups={sosGroups} initialVendorIdx={storyVendorIdx} onClose={() => setStoryVendorIdx(null)} />
      )}
      {commentPost && (
        <CommentModal post={commentPost} currentAgentId={currentAgentId} onClose={() => setCommentPost(null)} />
      )}
      {shareInChatPost && (
        <ShareInChatModal post={shareInChatPost} onClose={() => setShareInChatPost(null)} />
      )}

      {/* ── Bottom Navigation Bar (mobile only) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 sm:hidden">
        <div className="grid grid-cols-5 py-2">
          <button onClick={() => { setActiveTab('feed'); setFeedFilter('all'); }}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${activeTab === 'feed' && feedFilter === 'all' ? 'text-purple-600' : 'text-gray-400'}`}>
            <Home className="w-5 h-5" /> Feed
          </button>
          <button onClick={() => { setActiveTab('feed'); setFeedFilter('sos'); }}
            className={`relative flex flex-col items-center gap-0.5 text-[10px] font-medium ${activeTab === 'feed' && feedFilter === 'sos' ? 'text-purple-600' : 'text-gray-400'}`}>
            <AlertOctagon className="w-5 h-5" /> SOS
            {posts.filter(p => p.category.isSOS).length > 0 && <span className="absolute top-0 right-1/4 w-2 h-2 bg-red-500 rounded-full"></span>}
          </button>
          <Link href="/travel-agent/social/messages"
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-gray-400">
            <MessageCircle className="w-5 h-5" /> Messages
          </Link>
          <button onClick={() => setActiveTab('saved')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium ${activeTab === 'saved' ? 'text-purple-600' : 'text-gray-400'}`}>
            <Bookmark className="w-5 h-5" /> Saved
          </button>
          <Link href="/travel-agent/social/profile/me"
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-gray-400">
            <User className="w-5 h-5" /> Account
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default function SocialFeedPage() {
  return (
    <Suspense fallback={null}>
      <SocialFeedContent />
    </Suspense>
  );
}
