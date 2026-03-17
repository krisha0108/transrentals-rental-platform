'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Heart, MessageCircle, Bookmark, Share2, Plus, MoreVertical,
  Trash2, Building2, MapPin, Clock, X, Send, Zap, BookmarkCheck,
  ChevronLeft, ChevronRight, PenSquare, TrendingUp, MessageSquare, Users,
} from 'lucide-react';

/* ─── Types ─── */
interface Vendor { id: string; businessName: string; ownerName: string; logo?: string; city?: string; }
interface Category { id: string; name: string; isSOS: boolean; }
interface Post {
  id: string; content: string; createdAt: string;
  vendor: Vendor; category: Category;
  likedByMe: boolean; savedByMe: boolean; followedByMe: boolean;
  likesCount: number; commentsCount: number;
}
interface Comment { id: string; content: string; createdAt: string; vendor: Vendor; }
interface VendorStoryGroup { vendor: Vendor; posts: Post[]; }

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

function groupSOSByVendor(posts: any[]): VendorStoryGroup[] {
  const map = new Map<string, VendorStoryGroup>();
  for (const p of posts) {
    // Use vendorId (direct field on the post row) as the key — more reliable than p.vendor.id
    const key: string = p.vendorId ?? p.vendor?.id;
    if (!map.has(key)) map.set(key, { vendor: p.vendor, posts: [] });
    map.get(key)!.posts.push(p);
  }
  return Array.from(map.values());
}

/* ─── VendorAvatar ─── */
function VendorAvatar({ vendor, size = 40 }: { vendor: { businessName: string; logo?: string }; size?: number }) {
  const [err, setErr] = useState(false);
  const palette = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
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
   Story Viewer (unchanged logic)
══════════════════════════════════════ */
const STORY_DURATION = 6000;
const TICK = 50;

function StoryViewer({ groups, initialVendorIdx, onClose }: {
  groups: VendorStoryGroup[]; initialVendorIdx: number; onClose: () => void;
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
                <VendorAvatar vendor={g.vendor} size={24} />
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
            <Link href={`/vendor/social/profile/${currentPost.vendor.id}`} onClick={onClose}>
              <div className="p-[2px] rounded-full bg-gradient-to-br from-red-500 to-orange-400">
                <div className="p-[2px] bg-gray-900 rounded-full">
                  <VendorAvatar vendor={currentPost.vendor} size={40} />
                </div>
              </div>
            </Link>
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
            <Link href={`/vendor/social/profile/${currentPost.vendor.id}`} onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors border border-white/20">
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
function SOSStories({ groups, onOpen }: { groups: VendorStoryGroup[]; onOpen: (vi: number) => void }) {
  if (!groups.length) return null;
  const totalPosts = groups.reduce((s, g) => s + g.posts.length, 0);
  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-4 mb-4">
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
                <VendorAvatar vendor={g.vendor} size={52} />
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
function CommentModal({ post, currentVendorId, onClose }: { post: Post; currentVendorId?: string; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/vendor/social/posts/${post.id}/comment`).then(r => r.json())
      .then(d => { setComments(d.comments || []); setLoading(false); });
  }, [post.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/vendor/social/posts/${post.id}/comment`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }),
    });
    const data = await res.json();
    if (res.ok) { setComments(p => [...p, data.comment]); setText(''); }
    setSubmitting(false);
  };

  const deleteComment = async (cid: string) => {
    await fetch(`/api/vendor/social/posts/${post.id}/comment/${cid}`, { method: 'DELETE' });
    setComments(p => p.filter(c => c.id !== cid));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
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
            <div className="flex justify-center py-10"><div className="animate-spin h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full" /></div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10">
              <MessageCircle className="h-10 w-10 text-gray-200 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-gray-400 text-sm font-medium">No comments yet</p>
              <p className="text-gray-300 text-xs mt-1">Be the first to comment!</p>
            </div>
          ) : comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <VendorAvatar vendor={c.vendor} size={34} />
              <div className="flex-1 bg-gray-50 rounded-2xl px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-900">{c.vendor.businessName}</span>
                  <span className="text-[10px] text-gray-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{c.content}</p>
              </div>
              {c.vendor.id === currentVendorId && (
                <button onClick={() => deleteComment(c.id)} className="text-gray-300 hover:text-red-400 self-start pt-2 transition-colors flex-shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <form onSubmit={submit} className="flex gap-2">
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Add a comment..."
              className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm" />
            <button type="submit" disabled={submitting || !text.trim()}
              className="w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center hover:bg-violet-700 disabled:opacity-40 transition-colors flex-shrink-0">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Canvas Post Card Generator (for WhatsApp image share)
══════════════════════════════════════ */
async function generatePostCard(post: Post): Promise<Blob> {
  const W = 800, H = 480;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const sos = post.category.isSOS;
  const accent1 = sos ? '#ef4444' : '#7c3aed';
  const accent2 = sos ? '#f97316' : '#4f46e5';

  // White card background
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 0, 0, W, H, 0);

  // Top gradient bar
  const bar = ctx.createLinearGradient(0, 0, W, 0);
  bar.addColorStop(0, accent1); bar.addColorStop(1, accent2);
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, W, 10);

  // Subtle background tint
  ctx.fillStyle = sos ? '#fff7f7' : '#faf8ff';
  ctx.fillRect(0, 10, W, H - 10);

  // Avatar circle
  const av = { x: 52, y: 72, r: 28 };
  ctx.fillStyle = accent1;
  ctx.beginPath(); ctx.arc(av.x, av.y, av.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(post.vendor.businessName.charAt(0).toUpperCase(), av.x, av.y);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

  // Business name
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText(post.vendor.businessName, 92, 64);

  // Owner name
  ctx.fillStyle = '#6b7280';
  ctx.font = '15px system-ui, -apple-system, sans-serif';
  ctx.fillText(post.vendor.ownerName, 92, 85);

  // Category pill
  const catText = (sos ? '⚡ ' : '') + post.category.name;
  const catW = ctx.measureText(catText).width + 24;
  ctx.fillStyle = sos ? '#fee2e2' : '#ede9fe';
  roundRect(ctx, 92, 95, catW, 24, 12);
  ctx.fillStyle = sos ? '#dc2626' : '#7c3aed';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(catText, 104, 112);

  // Divider
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 136); ctx.lineTo(W - 40, 136); ctx.stroke();

  // Content text (word-wrapped)
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

  // Footer bar
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(0, H - 44, W, 44);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H - 44); ctx.lineTo(W, H - 44); ctx.stroke();

  // Footer logo text
  ctx.fillStyle = accent1;
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('TransRentals', 40, H - 15);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillText('Vendor Network', 130, H - 15);

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
    fetch('/api/vendor/social/chat/conversations')
      .then(r => r.json())
      .then(d => { setConversations(d.conversations || []); setLoading(false); });
  }, []);

  const shareToChat = async (convId: string) => {
    if (sending || sent) return;
    setSending(convId);
    // Send as a structured post card payload — chat window renders this as a card
    const content = JSON.stringify({
      __type: 'post_card',
      vendorName: post.vendor.businessName,
      ownerName: post.vendor.ownerName,
      category: post.category.name,
      isSOS: post.category.isSOS,
      content: post.content,
    });
    await fetch(`/api/vendor/social/chat/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    setSent(convId);
    setSending(null);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-violet-500" /> Share in Chat
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-4 py-3 bg-violet-50 border-b border-violet-100">
          <p className="text-[11px] text-violet-600 font-semibold mb-1">{post.vendor.businessName} · {post.category.name}</p>
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{post.content}</p>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400 font-medium">No conversations yet</p>
            <p className="text-xs text-gray-300 mt-1">Start a chat first from a vendor profile</p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto py-2">
            {conversations.map((conv: any) => (
              <button key={conv.id} onClick={() => shareToChat(conv.id)}
                disabled={!!sending || !!sent}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-60 text-left">
                <VendorAvatar vendor={conv.other} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{conv.other.businessName}</p>
                  <p className="text-xs text-gray-400 truncate">{conv.other.city || conv.other.ownerName}</p>
                </div>
                {sent === conv.id ? (
                  <span className="text-xs text-green-600 font-bold">Sent!</span>
                ) : sending === conv.id ? (
                  <div className="animate-spin h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full flex-shrink-0" />
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
   Post Card — enhanced
══════════════════════════════════════ */
function PostCard({ post, currentVendorId, onLike, onSave, onDelete, onComment, onShareInChat, onFollow }: {
  post: Post; currentVendorId?: string;
  onLike: (id: string) => void; onSave: (id: string) => void;
  onDelete: (id: string) => void; onComment: (post: Post) => void;
  onShareInChat: (post: Post) => void;
  onFollow: (vendorId: string, following: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [followedByMe, setFollowedByMe] = useState(post.followedByMe);
  const [followLoading, setFollowLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = post.vendor.id === currentVendorId;

  useEffect(() => { setFollowedByMe(post.followedByMe); }, [post.followedByMe]);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    setMenuOpen(false);
    const res = await fetch('/api/vendor/social/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followingId: post.vendor.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setFollowedByMe(data.following);
      onFollow(post.vendor.id, data.following);
    }
    setFollowLoading(false);
  };

  const shareWA = async () => {
    // Try canvas image → Web Share API (works on mobile)
    try {
      const blob = await generatePostCard(post);
      const file = new File([blob], 'post.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${post.vendor.businessName} on Vendor Network` });
        return;
      }
    } catch {}
    // Fallback: WhatsApp text
    const t = `*${post.vendor.businessName}* — _${post.category.name}_\n\n${post.content}\n\n— via TransRentals Vendor Network`;
    window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank');
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md ${post.category.isSOS ? 'border-l-4 border-l-red-400 border border-red-100' : 'border border-gray-100'}`}>

      {/* ── Header ── */}
      <div className="p-4 flex items-start gap-3">
        <Link href={`/vendor/social/profile/${post.vendor.id}`} className="flex-shrink-0 mt-0.5">
          <VendorAvatar vendor={post.vendor} size={46} />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/vendor/social/profile/${post.vendor.id}`}
                className="font-bold text-gray-900 hover:text-violet-600 text-sm transition-colors leading-tight block truncate">
                {post.vendor.businessName}
              </Link>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{post.vendor.ownerName}</p>
            </div>
            {/* Category badge — top right of name */}
            <span className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
              post.category.isSOS
                ? 'bg-red-100 text-red-600'
                : 'bg-violet-50 text-violet-600'
            }`}>
              {post.category.isSOS && <Zap className="h-2.5 w-2.5" />}
              {post.category.name}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
            {post.vendor.city && (
              <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                <MapPin className="h-3 w-3" />{post.vendor.city}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
              <Clock className="h-3 w-3" />{timeAgo(post.createdAt)}
            </span>
          </div>
        </div>

        {/* Menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-xl z-20 min-w-[170px] py-1 overflow-hidden">
              {!isOwner && (
                <button onClick={handleFollow} disabled={followLoading}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 disabled:opacity-50">
                  {followLoading
                    ? <span className="h-4 w-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    : <Users className="h-4 w-4 text-violet-500" />}
                  {followedByMe ? 'Unfollow' : 'Follow'}
                </button>
              )}
              {isOwner && (
                <button onClick={() => { onDelete(post.id); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5">
                  <Trash2 className="h-4 w-4" /> Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pb-4">
        <p className="text-gray-800 text-[14.5px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* ── Action Bar ── */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/40 flex items-center gap-1">
        {/* Like */}
        <button onClick={() => onLike(post.id)}
          className={`group flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
            post.likedByMe ? 'text-rose-600 bg-rose-50' : 'text-gray-500 hover:bg-gray-100 hover:text-rose-500'
          }`}>
          <Heart className={`h-[17px] w-[17px] transition-all ${post.likedByMe ? 'fill-current scale-110' : 'group-hover:scale-110'}`} />
          <span className="text-xs min-w-[12px]">{post.likesCount || ''}</span>
        </button>

        {/* Comment */}
        <button onClick={() => onComment(post)}
          className="group flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-violet-500 transition-all">
          <MessageCircle className="h-[17px] w-[17px] group-hover:scale-110 transition-transform" />
          <span className="text-xs min-w-[12px]">{post.commentsCount || ''}</span>
        </button>

        {/* Save */}
        <button onClick={() => onSave(post.id)}
          className={`group flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
            post.savedByMe ? 'text-amber-600 bg-amber-50' : 'text-gray-500 hover:bg-gray-100 hover:text-amber-500'
          }`}>
          {post.savedByMe
            ? <BookmarkCheck className="h-[17px] w-[17px] fill-current" />
            : <Bookmark className="h-[17px] w-[17px] group-hover:scale-110 transition-transform" />}
        </button>

        {/* Share — far right: WhatsApp */}
        <button onClick={shareWA} title="Share on WhatsApp"
          className="ml-auto group flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-green-50 hover:text-green-600 transition-all">
          <Share2 className="h-[17px] w-[17px] group-hover:scale-110 transition-transform" />
        </button>
        {/* Share in Chat */}
        <button onClick={() => onShareInChat(post)} title="Share in Chat"
          className="group flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-all">
          <MessageSquare className="h-[17px] w-[17px] group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}

/* ─── Skeleton ─── */
function PostSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse shadow-sm">
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
  const currentVendorId = session?.user?.id;
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

  const sosGroups = groupSOSByVendor(sosPosts);

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/social/categories');
    const data = await res.json();
    setCategories((data.categories || []).filter((c: any) => c.isActive && !c.isSOS));
  };

  const fetchSOS = async () => {
    const data = await (await fetch('/api/vendor/social/posts?type=sos')).json();
    setSosPosts(data.posts || []);
  };

  const fetchFeed = useCallback(async (catId?: string, cursor?: string) => {
    const p = new URLSearchParams();
    if (catId) p.set('categoryId', catId);
    if (cursor) p.set('cursor', cursor);
    return (await fetch(`/api/vendor/social/posts?${p}`)).json();
  }, []);

  const fetchSaved = useCallback(async (cursor?: string) => {
    const p = new URLSearchParams({ type: 'saved' });
    if (cursor) p.set('cursor', cursor);
    return (await fetch(`/api/vendor/social/posts?${p}`)).json();
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
    const res = await fetch(`/api/vendor/social/posts/${postId}/like`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: data.liked, likesCount: data.likesCount } : p));
  };

  const handleSave = async (postId: string) => {
    const res = await fetch(`/api/vendor/social/posts/${postId}/save`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, savedByMe: data.saved } : p)
          .filter(p => activeTab === 'saved' ? p.savedByMe : true)
    );
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    const res = await fetch(`/api/vendor/social/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) setPosts(prev => prev.filter(p => p.id !== postId));
  };

  // Sync follow state across all posts from the same vendor
  const handleFollow = (vendorId: string, following: boolean) => {
    setPosts(prev => prev.map(p =>
      p.vendor.id === vendorId ? { ...p, followedByMe: following } : p
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <TrendingUp className="h-5 w-5 text-violet-500" />
              <h1 className="text-xl font-bold text-gray-900">Vendor Network</h1>
            </div>
            <p className="text-xs text-gray-400 ml-7">Connect · Collaborate · Grow</p>
          </div>
          <Link href="/vendor/social/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 shadow-sm transition-all hover:shadow-md active:scale-95">
            <PenSquare className="h-4 w-4" /> New Post
          </Link>
        </div>

        {/* ── SOS Strip ── */}
        {sosGroups.length > 0 && (
          <SOSStories groups={sosGroups} onOpen={vi => setStoryVendorIdx(vi)} />
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
          {(['feed', 'saved'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {tab === 'feed' ? '🏠 Feed' : '🔖 Saved'}
            </button>
          ))}
        </div>

        {/* ── Category Chips ── */}
        {activeTab === 'feed' && categories.length > 0 && (
          <div className="flex gap-2 pb-1 mb-4" style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {[{ id: '', name: 'All Posts' }, ...categories].map(cat => (
              <button key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600'
                }`}>
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Posts ── */}
        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <PostSkeleton key={i} />)}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-5xl mb-4">{activeTab === 'saved' ? '🔖' : '📭'}</div>
            <p className="font-bold text-gray-700 text-base">
              {activeTab === 'saved' ? 'No saved posts yet' : selectedCategory ? 'No posts in this category' : 'No posts yet'}
            </p>
            <p className="text-sm text-gray-400 mt-1.5">
              {activeTab === 'saved' ? 'Bookmark posts to find them here' : 'Be the first to share something!'}
            </p>
            {activeTab === 'feed' && (
              <Link href="/vendor/social/create"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors">
                <PenSquare className="h-4 w-4" /> Create Post
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} currentVendorId={currentVendorId}
                onLike={handleLike} onSave={handleSave} onDelete={handleDelete}
                onComment={setCommentPost} onShareInChat={setShareInChatPost}
                onFollow={handleFollow} />
            ))}
            {nextCursor && (
              <button onClick={loadMore} disabled={loadingMore}
                className="w-full py-3 text-sm font-bold text-violet-600 hover:bg-violet-50 rounded-xl border border-violet-100 disabled:opacity-50 transition-colors">
                {loadingMore ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-violet-600 border-t-transparent rounded-full inline-block" />
                    Loading...
                  </span>
                ) : 'Load more posts'}
              </button>
            )}
          </div>
        )}
      </div>

      {storyVendorIdx !== null && sosGroups.length > 0 && (
        <StoryViewer groups={sosGroups} initialVendorIdx={storyVendorIdx} onClose={() => setStoryVendorIdx(null)} />
      )}
      {commentPost && (
        <CommentModal post={commentPost} currentVendorId={currentVendorId} onClose={() => setCommentPost(null)} />
      )}
      {shareInChatPost && (
        <ShareInChatModal post={shareInChatPost} onClose={() => setShareInChatPost(null)} />
      )}
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
